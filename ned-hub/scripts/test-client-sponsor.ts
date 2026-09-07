import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { connection } from '../src/lib/solana';
import { sendSponsoredTransaction } from '../src/lib/sponsorClient';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function main() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU TEST TÍCH HỢP CLIENT-SIDE GASLESS TRANSACTION');
  console.log('🌐 Server API:', BASE_URL);
  console.log('⚡ Solana RPC Endpoint:', connection.rpcEndpoint);
  console.log('================================================================\n');

  try {
    // ----------------------------------------------------
    // BƯỚC 1: Khởi tạo thông tin người dùng giả lập
    // ----------------------------------------------------
    console.log('📋 [BƯỚC 1] Khởi tạo môi trường client giả lập...');
    const userKeypair = Keypair.generate();
    const recipientKeypair = Keypair.generate();

    console.log(`   - Khách tham quan (User Public Key): ${userKeypair.publicKey.toBase58()}`);
    console.log(`   - Địa chỉ nhận (Recipient Public Key): ${recipientKeypair.publicKey.toBase58()}`);

    // ----------------------------------------------------
    // BƯỚC 2: Tạo transaction mẫu (Gasless Transfer / Action)
    // ----------------------------------------------------
    console.log('\n📝 [BƯỚC 2] Tạo giao dịch mẫu (SystemProgram.transfer)...');
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userKeypair.publicKey,
        toPubkey: recipientKeypair.publicKey,
        lamports: 0, // 0 lamport để kiểm thử hành động ký của khách tham quan không tốn SOL
      })
    );

    // ----------------------------------------------------
    // BƯỚC 3: Lấy thông tin ví Relayer & Blockhash
    // ----------------------------------------------------
    console.log('⚡ [BƯỚC 3] Lấy blockhash mới nhất và địa chỉ ví Relayer...');
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;

    // Lấy public key của Relayer từ endpoint
    const relayerRes = await fetch(`${BASE_URL}/api/relayer-balance`);
    if (!relayerRes.ok) {
      throw new Error(`Không thể kết nối /api/relayer-balance: HTTP ${relayerRes.status}`);
    }
    const relayerData = await relayerRes.json();
    console.log(`   - Ví Relayer bảo trợ: ${relayerData.address} (Số dư: ${relayerData.balance} SOL)`);

    // Gán feePayer là ví Relayer
    transaction.feePayer = new PublicKey(relayerData.address);

    // ----------------------------------------------------
    // BƯỚC 4: Người dùng ký phần giao dịch của mình (Partial Sign)
    // ----------------------------------------------------
    console.log('\n✍️  [BƯỚC 4] Người dùng thực hiện partialSign...');
    transaction.partialSign(userKeypair);

    // Serialize sang chuỗi Base64
    const partialTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');
    console.log(`   - Đã serialize partialTransaction (${partialTransaction.length} bytes base64)`);

    // ----------------------------------------------------
    // BƯỚC 5: Gửi request POST lên /api/sponsor-tx
    // ----------------------------------------------------
    console.log('\n📡 [BƯỚC 5] Gửi partialTransaction lên /api/sponsor-tx...');
    const startTime = Date.now();
    const sponsorRes = await fetch(`${BASE_URL}/api/sponsor-tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        partialTransaction,
      }),
    });

    const duration = Date.now() - startTime;
    const sponsorResult = await sponsorRes.json();

    if (!sponsorRes.ok || !sponsorResult.success) {
      console.error('\n❌ GIAO DỊCH THẤT BẠI!');
      console.error(`   - HTTP Status: ${sponsorRes.status}`);
      console.error(`   - Chi tiết lỗi:`, sponsorResult);
      process.exit(1);
    }

    // ----------------------------------------------------
    // BƯỚC 6: Kết quả thành công
    // ----------------------------------------------------
    const signature = sponsorResult.signature;
    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

    console.log('\n🎉 ================================================================');
    console.log('✅ GIAO DỊCH ĐÃ ĐƯỢC TÀI TRỢ GAS VÀ BROADCAST THÀNH CÔNG!');
    console.log('================================================================');
    console.log(`⏱️  Thời gian xử lý: ${duration}ms`);
    console.log(`🔑 Signature (Mã xác thực): ${signature}`);
    console.log(`🔗 Solana Explorer: ${explorerUrl}`);

    // ----------------------------------------------------
    // BƯỚC 7: Test bổ sung qua Helper sendSponsoredTransaction
    // ----------------------------------------------------
    console.log('\n🧪 [TEST BỔ SUNG] Kiểm tra chạy qua Helper src/lib/sponsorClient.ts...');
    const testUser2 = Keypair.generate();
    const tx2 = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: testUser2.publicKey,
        toPubkey: recipientKeypair.publicKey,
        lamports: 0,
      })
    );

    const helperResult = await sendSponsoredTransaction(connection, tx2, testUser2, {
      apiUrl: `${BASE_URL}/api/sponsor-tx`,
      relayerBalanceApiUrl: `${BASE_URL}/api/relayer-balance`,
    });

    console.log(`✅ Helper hoạt động hoàn hảo! Signature 2: ${helperResult.signature}`);
    console.log(`🔗 Explorer 2: ${helperResult.explorerUrl}`);
    console.log('\n================================================================');
    console.log('🎯 TẤT CẢ CÁC BƯỚC KIỂM THỬ ĐÃ THÀNH CÔNG RỰC RỠ!');
    console.log('================================================================');
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('\n💥 LỖI NGOẠI LỆ TRONG QUÁ TRÌNH TEST:', errorMsg);
    process.exit(1);
  }
}

main();
