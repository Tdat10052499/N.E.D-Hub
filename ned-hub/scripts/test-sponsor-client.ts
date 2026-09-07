import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  sendSponsoredTransaction,
  getRelayerPublicKey,
  WalletAdapterSigner,
} from '../src/lib/sponsorClient';

const BASE_URL = 'http://localhost:3000';
const RPC_URL = 'https://api.devnet.solana.com';

async function runSponsorClientTests() {
  console.log('====================================================');
  console.log('🧪 TEST: CLIENT-SIDE GASLESS TRANSACTION HELPER');
  console.log('====================================================\n');

  const connection = new Connection(RPC_URL, 'confirmed');

  // ----------------------------------------------------
  // TEST 1: getRelayerPublicKey helper
  // ----------------------------------------------------
  console.log('📌 [TEST 1] Lấy địa chỉ ví Relayer qua helper getRelayerPublicKey()...');
  try {
    const relayerPubkey = await getRelayerPublicKey(`${BASE_URL}/api/relayer-balance`);
    console.log(`✅ Thành công! Địa chỉ Relayer: ${relayerPubkey.toBase58()}\n`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ TEST 1 Thất bại:', msg);
    process.exit(1);
  }

  // ----------------------------------------------------
  // TEST 2: sendSponsoredTransaction với Keypair
  // ----------------------------------------------------
  console.log('📌 [TEST 2] Gửi giao dịch gasless với Keypair người dùng...');
  try {
    const userKeypair = Keypair.generate();
    const recipient = Keypair.generate();

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userKeypair.publicKey,
        toPubkey: recipient.publicKey,
        lamports: 0,
      })
    );

    const result = await sendSponsoredTransaction(connection, tx, userKeypair, {
      apiUrl: `${BASE_URL}/api/sponsor-tx`,
      relayerBalanceApiUrl: `${BASE_URL}/api/relayer-balance`,
    });

    console.log('✅ TEST 2 Thành công!');
    console.log(`   - Signature: ${result.signature}`);
    console.log(`   - Explorer: ${result.explorerUrl}\n`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ TEST 2 Thất bại:', msg);
    process.exit(1);
  }

  // ----------------------------------------------------
  // TEST 3: sendSponsoredTransaction với Wallet Adapter (Giả lập Phantom/Solflare)
  // ----------------------------------------------------
  console.log('📌 [TEST 3] Gửi giao dịch gasless với Wallet Adapter interface (Phantom/Solflare)...');
  try {
    const userKeypair = Keypair.generate();
    const recipient = Keypair.generate();

    // Giả lập đối tượng wallet adapter
    const mockWalletAdapter: WalletAdapterSigner = {
      publicKey: userKeypair.publicKey,
      signTransaction: async (transaction: Transaction) => {
        transaction.partialSign(userKeypair);
        return transaction;
      },
    };

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: mockWalletAdapter.publicKey,
        toPubkey: recipient.publicKey,
        lamports: 0,
      })
    );

    const result = await sendSponsoredTransaction(connection, tx, mockWalletAdapter, {
      apiUrl: `${BASE_URL}/api/sponsor-tx`,
      relayerBalanceApiUrl: `${BASE_URL}/api/relayer-balance`,
    });

    console.log('✅ TEST 3 Thành công!');
    console.log(`   - Signature: ${result.signature}`);
    console.log(`   - Explorer: ${result.explorerUrl}\n`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ TEST 3 Thất bại:', msg);
    process.exit(1);
  }

  console.log('====================================================');
  console.log('🎉 TẤT CẢ TEST CLIENT GASLESS TRANSACTION ĐÃ VƯỢT QUA!');
  console.log('====================================================');
}

runSponsorClientTests();
