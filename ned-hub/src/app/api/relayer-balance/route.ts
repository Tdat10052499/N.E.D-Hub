import { NextResponse } from 'next/server';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { connection, getAdminKeypair } from '@/lib/solana';

export async function GET() {
  try {
    const adminKeypair = getAdminKeypair();
    const lamports = await connection.getBalance(adminKeypair.publicKey);
    const balance = lamports / LAMPORTS_PER_SOL;

    return NextResponse.json({
      address: adminKeypair.publicKey.toBase58(),
      balance,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch relayer balance';
    console.error('Error fetching relayer balance:', error);

    return NextResponse.json(
      {
        error: errorMessage,
        details: String(error),
      },
      { status: 500 }
    );
  }
}
