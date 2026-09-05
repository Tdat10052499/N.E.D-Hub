import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

async function runRelayerTests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ HỆ THỐNG GAS STATION / RELAYER');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`⚡ RPC URL: ${RPC_URL}`);
  console.log('====================================================\n');

  let relayerAddress = '';

  // ----------------------------------------------------
  // TEST 1: GET /api/relayer-balance
  // ----------------------------------------------------
  console.log('📌 [TEST 1] Kiểm tra GET /api/relayer-balance ...');
  try {
    const res = await fetch(`${BASE_URL}/api/relayer-balance`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${JSON.stringify(data)}`);
    }

    console.log('✅ Kết nối thành công tới /api/relayer-balance!');
    console.log(`   - Địa chỉ ví Relayer: ${data.address}`);
    console.log(`   - Số dư ví (Balance): ${data.balance} SOL`);

    if (data.balance <= 0) {
      console.warn('⚠️ Cảnh báo: Ví Relayer không đủ số dư SOL để tài trợ gas!');
    }

    relayerAddress = data.address;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ TEST 1 THẤT BẠI:', errorMessage);
    process.exit(1);
  }

  console.log('\n----------------------------------------------------\n');

  // ----------------------------------------------------
  // TEST 2: POST /api/sponsor-tx
  // ----------------------------------------------------
  console.log('📌 [TEST 2] Kiểm tra POST /api/sponsor-tx ...');
  try {
    const connection = new Connection(RPC_URL, 'confirmed');

    // 1. Tạo sender & recipient ngẫu nhiên
    const sender = Keypair.generate();
    const recipient = Keypair.generate();

    console.log(
      `   - Sender Public Key (Ví Client giả lập): ${sender.publicKey.toBase58()}`
    );
    console.log(`   - Recipient Public Key: ${recipient.publicKey.toBase58()}`);
    console.log(`   - Relayer / Fee Payer Public Key: ${relayerAddress}`);

    // 2. Tạo transaction (0 lamport transfer để test mà không cần airdrop cho sender)
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipient.publicKey,
        lamports: 0,
      })
    );

    // 3. Lấy blockhash mới nhất và gán feePayer là ví Relayer
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = new PublicKey(relayerAddress);

    // 4. Sender ký phần của mình (partialSign)
    tx.partialSign(sender);

    // 5. Serialize sang chuỗi Base64
    const serializedTx = tx
      .serialize({ requireAllSignatures: false })
      .toString('base64');
    console.log('   - Đã tạo & ký partialTransaction bởi client.');
    console.log('   - Đang gửi request POST tới /api/sponsor-tx ...');

    // 6. Gửi request POST tới API
    const res = await fetch(`${BASE_URL}/api/sponsor-tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        partialTransaction: serializedTx,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(
        `API trả về lỗi (${res.status}): ${JSON.stringify(result)}`
      );
    }

    console.log(
      '✅ TEST 2 THÀNH CÔNG! Giao dịch đã được Relayer tài trợ phí và gửi lên Devnet.'
    );
    console.log(`   - Signature: ${result.signature}`);
    console.log(
      `   - Solana Explorer: https://explorer.solana.com/tx/${result.signature}?cluster=devnet`
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ TEST 2 THẤT BẠI:', errorMessage);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('🎉 TẤT CẢ CÁC KIỂM THỬ RELAYER ĐỀU ĐÃ VƯỢT QUA!');
  console.log('====================================================');
}

runRelayerTests();
