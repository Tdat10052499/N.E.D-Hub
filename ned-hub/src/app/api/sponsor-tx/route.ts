import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@solana/web3.js';
import { connection, getAdminKeypair } from '@/lib/solana';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partialTransaction } = body;

    if (!partialTransaction || typeof partialTransaction !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid partialTransaction in request body' },
        { status: 400 }
      );
    }

    const adminKeypair = getAdminKeypair();

    // Chuyển đổi chuỗi Base64 thành đối tượng Transaction của Solana Web3.js
    const txBuffer = Buffer.from(partialTransaction, 'base64');
    const transaction = Transaction.from(txBuffer);

    // Ghi đè thuộc tính feePayer của giao dịch thành adminKeypair.publicKey
    transaction.feePayer = adminKeypair.publicKey;

    // Thực thi transaction.partialSign(adminKeypair) để ký xác thực trả phí
    transaction.partialSign(adminKeypair);

    // Đẩy giao dịch hoàn chỉnh lên mạng lưới bằng connection.sendRawTransaction()
    const rawTx = transaction.serialize();
    const signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    return NextResponse.json({
      success: true,
      signature,
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
