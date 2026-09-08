import { NextRequest, NextResponse } from 'next/server';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { connection, getAdminKeypair } from '@/lib/solana';
import { supabaseAdmin } from '@/lib/supabase';

// ─── 1. Khai báo Program ID hợp lệ của Smart Contract N.E.D Identity ────────
export const VALID_PROGRAM_ID = new PublicKey(
  '8tTSP75q3ggaxQiZdeC4LShcyjHN5yWJY4NnZeE3JaEi'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partialTransaction } = body;

    if (!partialTransaction || typeof partialTransaction !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu hoặc sai định dạng partialTransaction trong request body' },
        { status: 400 }
      );
    }

    const adminKeypair = getAdminKeypair();
    const relayerPubkey = adminKeypair.publicKey;

    // ─── Deserialize chuỗi Base64 thành đối tượng Transaction ───────────────
    const txBuffer = Buffer.from(partialTransaction, 'base64');
    const transaction = Transaction.from(txBuffer);

    // ─── 2. Xây dựng Bộ lọc Giao dịch (Transaction Filter) ───────────────────
    if (!transaction.instructions || transaction.instructions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Giao dịch không chứa instruction hợp lệ nào.',
        },
        { status: 400 }
      );
    }

    // Kiểm tra toàn bộ instruction: Phải có ít nhất một instruction tương tác với VALID_PROGRAM_ID
    const hasValidProgramInstruction = transaction.instructions.some((ix) =>
      ix.programId.equals(VALID_PROGRAM_ID)
    );

    if (!hasValidProgramInstruction) {
      console.warn(
        `[Relayer Security] Từ chối tài trợ: Giao dịch không tương tác với Program ID hợp lệ (${VALID_PROGRAM_ID.toBase58()}).`
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Giao dịch chứa instruction không được phép. Relayer từ chối tài trợ.',
          code: 'UNAUTHORIZED_INSTRUCTION',
          validProgramId: VALID_PROGRAM_ID.toBase58(),
        },
        { status: 403 }
      );
    }

    // ─── 3. Kiểm tra tính hợp lệ của Fee Payer & Chống rút ruột ví ───────────
    for (const ix of transaction.instructions) {
      // Kiểm tra lệnh SystemProgram (chuyển SOL, tạo tài khoản)
      if (ix.programId.equals(SystemProgram.programId)) {
        // Nếu ví Relayer xuất hiện ở vị trí người chuyển tiền (fromPubkey) và có quyền ghi -> Chặn ngay lập tức
        const isRelayerSourceOfFunds = ix.keys.some(
          (k, idx) => idx === 0 && k.pubkey.equals(relayerPubkey) && k.isWritable
        );

        if (isRelayerSourceOfFunds) {
          console.warn(
            `[Relayer Security ALERT] Phát hiện hành vi rút ruột ví: Giao dịch cố ý trừ SOL từ ví Relayer (${relayerPubkey.toBase58()}).`
          );
          return NextResponse.json(
            {
              success: false,
              error: 'Giao dịch chứa instruction không được phép. Relayer từ chối tài trợ.',
              code: 'DRAIN_ATTEMPT_BLOCKED',
            },
            { status: 403 }
          );
        }
      }

      // Đảm bảo ví Relayer không bị đặt làm tài khoản bị trừ tiền trong bất kỳ instruction nào ngoài phạm vi
      const isRelayerUnauthorizedDebit = ix.keys.some(
        (k) =>
          k.pubkey.equals(relayerPubkey) &&
          k.isWritable &&
          !ix.programId.equals(VALID_PROGRAM_ID)
      );

      if (isRelayerUnauthorizedDebit) {
        console.warn(
          `[Relayer Security] Ví Relayer xuất hiện ở vị trí khả nghi trong instruction của program: ${ix.programId.toBase58()}`
        );
        return NextResponse.json(
          {
            success: false,
            error: 'Giao dịch chứa instruction không được phép. Relayer từ chối tài trợ.',
            code: 'INVALID_FEE_PAYER_SCOPE',
          },
          { status: 403 }
        );
      }
    }

    // Gán ví Relayer làm feePayer duy nhất của giao dịch
    transaction.feePayer = relayerPubkey;

    // Ký xác thực trả phí gas (Relayer Sponsor Sign)
    transaction.partialSign(adminKeypair);

    // Đẩy giao dịch hoàn chỉnh lên mạng lưới Solana
    const rawTx = transaction.serialize();
    const signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: true,
      preflightCommitment: 'confirmed',
    });

    // ─── 4. Cập nhật Log vào Supabase (relayer_logs) ─────────────────────────
    // Trích xuất địa chỉ ví người dùng từ signatures / instruction keys
    const userSignature = transaction.signatures.find(
      (s) => s.publicKey && !s.publicKey.equals(relayerPubkey)
    );
    const userWalletAddress =
      userSignature?.publicKey?.toBase58() ||
      transaction.instructions[0]?.keys[0]?.pubkey?.toBase58() ||
      'Unknown User';

    const shortName =
      userWalletAddress.length >= 8
        ? `${userWalletAddress.slice(0, 4)}...${userWalletAddress.slice(-4)}`
        : userWalletAddress;

    try {
      await supabaseAdmin.from('relayer_logs').insert({
        wallet_address: userWalletAddress,
        username: shortName,
        action: 'Register Identity',
        amount_sol: 0.000005,
        signature: signature,
        created_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.warn('Supabase relayer_logs insert warning:', logErr);
    }

    return NextResponse.json({
      success: true,
      signature,
      action: 'Register Identity',
      programId: VALID_PROGRAM_ID.toBase58(),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to sponsor transaction';
    console.error('Error sponsoring transaction:', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: String(error),
      },
      { status: 500 }
    );
  }
}
