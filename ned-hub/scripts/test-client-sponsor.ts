import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { connection } from '../src/lib/solana';
import { sendSponsoredTransaction } from '../src/lib/sponsorClient';
import { VALID_PROGRAM_ID } from '../src/app/api/sponsor-tx/route';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function main() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU TEST BẢO MẬT VÀ TÍCH HỢP GASLESS RELAYER API');
  console.log('🌐 Server API:', BASE_URL);
  console.log('⚡ Solana RPC Endpoint:', connection.rpcEndpoint);
  console.log('🔒 Smart Contract Program ID:', VALID_PROGRAM_ID.toBase58());
  console.log('================================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Kiểm thử Bảo mật - Giao dịch không chứa Program ID hợp lệ (BẮT BUỘC BỊ TỪ CHỐI 403)
    // ----------------------------------------------------
    console.log('🛡️  [TEST 1] Kiểm thử Bộ lọc Bảo mật (Chặn giao dịch không hợp lệ)...');
    const userKeypair = Keypair.generate();
    const fakeProgramId = Keypair.generate().publicKey;

    const invalidTx = new Transaction().add(
      new TransactionInstruction({
        programId: fakeProgramId,
        keys: [{ pubkey: userKeypair.publicKey, isSigner: true, isWritable: true }],
        data: Buffer.from([]),
      })
    );

    const { blockhash: b1 } = await connection.getLatestBlockhash('confirmed');
    invalidTx.recentBlockhash = b1;

    // Lấy thông tin ví Relayer
    const relayerRes = await fetch(`${BASE_URL}/api/relayer-balance`);
    const relayerData = await relayerRes.json();
    invalidTx.feePayer = new PublicKey(relayerData.address);
    invalidTx.partialSign(userKeypair);

    const invalidPartialTx = invalidTx
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const rejectRes = await fetch(`${BASE_URL}/api/sponsor-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partialTransaction: invalidPartialTx }),
    });

    const rejectResult = await rejectRes.json();
    if (rejectRes.status === 403 && !rejectResult.success) {
      console.log('   ✅ ĐÃ CHẶN THÀNH CÔNG GIAO DỊCH LẠ (HTTP 403 Forbidden)!');
      console.log('   - Thông báo từ Relayer:', rejectResult.error);
      console.log('   - Mã lỗi:', rejectResult.code);
    } else {
      throw new Error(`Bộ lọc bảo mật thất bại! Status: ${rejectRes.status}`);
    }

    // ----------------------------------------------------
    // TEST 2: Giao dịch HỢP LỆ chứa Program ID N.E.D Identity
    // ----------------------------------------------------
    console.log('\n📝 [TEST 2] Tạo giao dịch HỢP LỆ tương tác với N.E.D Identity Program...');
    const validUser = Keypair.generate();

    const identityInstruction = new TransactionInstruction({
      programId: VALID_PROGRAM_ID,
      keys: [
        { pubkey: validUser.publicKey, isSigner: true, isWritable: true },
      ],
      data: Buffer.from([1, 0, 0, 0]), // Identity Register Instruction
    });

    const validTx = new Transaction().add(identityInstruction);
    const { blockhash: b2 } = await connection.getLatestBlockhash('confirmed');
    validTx.recentBlockhash = b2;
    validTx.feePayer = new PublicKey(relayerData.address);

    validTx.partialSign(validUser);
    const validPartialTx = validTx
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    console.log('   - Gửi yêu cầu bảo trợ gas lên /api/sponsor-tx...');
    const startTime = Date.now();
    const sponsorRes = await fetch(`${BASE_URL}/api/sponsor-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partialTransaction: validPartialTx }),
    });

    const duration = Date.now() - startTime;
    const sponsorResult = await sponsorRes.json();

    if (!sponsorRes.ok || !sponsorResult.success) {
      console.error('\n❌ GIAO DỊCH HỢP LỆ BỊ TỪ CHỐI BẤT THƯỜNG!');
      console.error(`   - HTTP Status: ${sponsorRes.status}`);
      console.error(`   - Chi tiết lỗi:`, sponsorResult);
      process.exit(1);
    }

    const signature = sponsorResult.signature;
    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

    console.log('\n🎉 ================================================================');
    console.log('✅ GIAO DỊCH N.E.D IDENTITY ĐÃ ĐƯỢC TÀI TRỢ GAS VÀ KÝ THÀNH CÔNG!');
    console.log('================================================================');
    console.log(`⏱️  Thời gian xử lý: ${duration}ms`);
    console.log(`🔑 Signature: ${signature}`);
    console.log(`📋 Action: ${sponsorResult.action}`);
    console.log(`🔒 Program ID: ${sponsorResult.programId}`);
    console.log(`🔗 Solana Explorer: ${explorerUrl}`);

    // ----------------------------------------------------
    // TEST 3: Kiểm thử Helper sendSponsoredTransaction
    // ----------------------------------------------------
    console.log('\n🧪 [TEST 3] Kiểm thử Helper src/lib/sponsorClient.ts với Identity Program...');
    const testUser3 = Keypair.generate();
    const helperTx = new Transaction().add(
      new TransactionInstruction({
        programId: VALID_PROGRAM_ID,
        keys: [{ pubkey: testUser3.publicKey, isSigner: true, isWritable: true }],
        data: Buffer.from([1, 0, 0, 0]),
      })
    );

    const helperResult = await sendSponsoredTransaction(connection, helperTx, testUser3, {
      apiUrl: `${BASE_URL}/api/sponsor-tx`,
      relayerBalanceApiUrl: `${BASE_URL}/api/relayer-balance`,
    });

    console.log(`✅ Helper hoạt động xuất sắc! Signature: ${helperResult.signature}`);
    console.log(`🔗 Explorer: ${helperResult.explorerUrl}`);
    console.log('\n================================================================');
    console.log('🎯 TẤT CẢ CÁC BƯỚC KIỂM THỬ BẢO MẬT & RELAYER ĐÃ THÀNH CÔNG RỰC RỠ!');
    console.log('================================================================');
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('\n💥 LỖI NGOẠI LỆ TRONG QUÁ TRÌNH TEST:', errorMsg);
    process.exit(1);
  }
}

main();
