import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const endpoint =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export const connection = new Connection(endpoint, 'confirmed');

export function getAdminKeypair(): Keypair {
  const secretKeyString = process.env.ADMIN_SECRET_KEY;
  if (!secretKeyString) {
    throw new Error('ADMIN_SECRET_KEY is not defined in environment variables');
  }

  const secretKey = bs58.decode(secretKeyString);
  return Keypair.fromSecretKey(secretKey);
}
