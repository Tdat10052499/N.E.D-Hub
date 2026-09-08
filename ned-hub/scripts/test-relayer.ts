import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

const VALID_PROGRAM_ID = new PublicKey(
  '8tTSP75q3ggaxQiZdeC4LShcyjHN5yWJY4NnZeE3JaEi'
);

async function main() {
  console.log('================================================================');
  console.log('🛡️  BẮT ĐẦU KIỂM THỬ BẢO MẬT RELAYER API (/api/sponsor-tx)');
  console.log('🌐 Server API:', BASE_URL);
  console.log('⚡ Solana RPC Endpoint:', RPC_URL);
  console.log('🔒 Whitelisted Program ID:', VALID_PROGRAM_ID.toBase58());
  console.log('================================================================\n');

  try {
    // ----------------------------------------------------
    // BƯỚC 1: Chuẩn bị môi trường & Khởi tạo ví người dùng
    // ----------------------------------------------------
    console.log('📋 [BƯỚC 1] Chuẩn bị môi trường & khởi tạo ví người dùng...');
    const connection = new Connection(RPC_URL, 'confirmed');
    const userKeypair = Keypair.generate();

    console.log(`   - Ví Người dùng (User Public Key): ${userKeypair.publicKey.toBase58()}`);

    // Lấy thông tin và số dư ví Relayer từ API
    const relayerRes = await fetch(`${BASE_URL}/api/relayer-balance`);
    if (!relayerRes.ok) {
      throw new Error(`Không thể kết nối /api/relayer-balance: HTTP ${relayerRes.status}`);
    }
    const relayerData = await relayerRes.json();
    const relayerPublicKey = new PublicKey(relayerData.address);
    console.log(`   - Ví Relayer Bảo trợ: ${relayerData.address} (Số dư: ${relayerData.balance} SOL)`);

    // Lấy blockhash mới nhất từ mạng Solana Devnet
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    console.log(`   - Blockhash mới nhất: ${blockhash}`);

    console.log('\n----------------------------------------------------\n');

    // ----------------------------------------------------
    // BƯỚC 2: Tạo & Gửi Giao dịch HỢP LỆ (Gọi Program N.E.D Identity)
    // ----------------------------------------------------
    console.log('✅ [BƯỚC 2] Kiểm thử Giao dịch HỢP LỆ (Gọi Program N.E.D Identity)...');

    // Khởi tạo Transaction chứa instruction tương tác với VALID_PROGRAM_ID
    const identityInstruction = new TransactionInstruction({
      programId: VALID_PROGRAM_ID,
      keys: [
        { pubkey: userKeypair.publicKey, isSigner: true, isWritable: true },
      ],
      data: Buffer.from([1, 0, 0, 0]), // Dữ liệu đăng ký định danh N.E.D
    });

    const validTx = new Transaction().add(identityInstruction);
    validTx.recentBlockhash = blockhash;
    validTx.feePayer = relayerPublicKey;

    // Người dùng ký một phần (partialSign)
    validTx.partialSign(userKeypair);

    // Serialize sang Base64
    const validBase64 = validTx
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    console.log('   - Đã đóng gói partialTransaction hợp lệ (Base64).');
    console.log('   - Gửi yêu cầu bảo trợ gas tới POST /api/sponsor-tx...');

    const validStartTime = Date.now();
    const validRes = await fetch(`${BASE_URL}/api/sponsor-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partialTransaction: validBase64 }),
    });

    const validDuration = Date.now() - validStartTime;
    const validResult = await validRes.json();

    if (validRes.ok && validResult.success) {
      console.log('   🎉 GIAO DỊCH HỢP LỆ ĐƯỢC TÀI TRỢ THÀNH CÔNG (HTTP 200 OK)!');
      console.log(`   - Thời gian xử lý: ${validDuration}ms`);
      console.log(`   - Signature: ${validResult.signature}`);
      console.log(`   - Action: ${validResult.action}`);
      console.log(`   - Program ID: ${validResult.programId}`);
      console.log(`   - Solana Explorer: https://explorer.solana.com/tx/${validResult.signature}?cluster=devnet`);
    } else {
      throw new Error(`Giao dịch hợp lệ bị từ chối bất thường! HTTP ${validRes.status}: ${JSON.stringify(validResult)}`);
    }

    console.log('\n----------------------------------------------------\n');

    // ----------------------------------------------------
    // BƯỚC 3: Tạo & Gửi Giao dịch ĐỘC HẠI (Tấn công lừa rút 1 SOL từ Relayer)
    // ----------------------------------------------------
    console.log('🚨 [BƯỚC 3] Kiểm thử Giao dịch ĐỘC HẠI (Tấn công lừa rút 1 SOL từ Relayer)...');

    // Khởi tạo Transaction chứa instruction SystemProgram.transfer định lừa Relayer chuyển 1 SOL ra ngoài
    const maliciousTransferInstruction = SystemProgram.transfer({
      fromPubkey: relayerPublicKey, // Cố tình đặt nguồn tiền trừ từ ví Relayer
      toPubkey: userKeypair.publicKey, // Người nhận là ví kẻ tấn công
      lamports: 1 * LAMPORTS_PER_SOL, // 1 SOL
    });

    const maliciousTx = new Transaction().add(maliciousTransferInstruction);
    maliciousTx.recentBlockhash = blockhash;
    maliciousTx.feePayer = relayerPublicKey;

    // Serialize sang Base64
    const maliciousBase64 = maliciousTx
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    console.log('   - Đã tạo Transaction độc hại (SystemProgram.transfer 1 SOL từ Relayer).');
    console.log('   - Gửi payload độc hại tới POST /api/sponsor-tx...');

    const maliciousRes = await fetch(`${BASE_URL}/api/sponsor-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partialTransaction: maliciousBase64 }),
    });

    const maliciousResult = await maliciousRes.json();

    console.log(`   - HTTP Status nhận được: ${maliciousRes.status}`);
    console.log(`   - Chi tiết phản hồi từ Server:`, maliciousResult);

    // Bắt buộc phải trả về lỗi 403 Forbidden
    if (maliciousRes.status === 403 && !maliciousResult.success) {
      console.log('\n🛡️  ================================================================');
      console.log('🔒 BẢO VỆ THÀNH CÔNG: RELAYER ĐÃ TỪ CHỐI TÀI TRỢ GIAO DỊCH ĐỘC HẠI!');
      console.log('================================================================');
      console.log(`   - Trạng thái HTTP: 403 Forbidden (Chuẩn xác theo yêu cầu)`);
      console.log(`   - Thông báo bảo mật: "${maliciousResult.error}"`);
      console.log(`   - Mã bảo mật: ${maliciousResult.code}`);
      console.log('   - Kết luận: Relayer API chống rút ruột ví hoạt động an toàn tuyệt đối!');
    } else {
      throw new Error(`CẢNH BÁO NGUY HIỂM: Giao dịch độc hại không bị chặn 403 (HTTP ${maliciousRes.status})!`);
    }

    // ----------------------------------------------------
    // BƯỚC 4: Kiểm thử thêm giao dịch gọi Program lạ ngoài Whitelist
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------\n');
    console.log('🛡️  [BƯỚC 4] Kiểm thử Giao dịch gọi Program ID lạ (Không thuộc Whitelist)...');
    const fakeProgramKeypair = Keypair.generate();
    const fakeInstruction = new TransactionInstruction({
      programId: fakeProgramKeypair.publicKey, // Program ID không hợp lệ
      keys: [{ pubkey: userKeypair.publicKey, isSigner: true, isWritable: true }],
      data: Buffer.from([]),
    });

    const fakeTx = new Transaction().add(fakeInstruction);
    fakeTx.recentBlockhash = blockhash;
    fakeTx.feePayer = relayerPublicKey;
    fakeTx.partialSign(userKeypair);

    const fakeBase64 = fakeTx
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const fakeRes = await fetch(`${BASE_URL}/api/sponsor-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partialTransaction: fakeBase64 }),
    });

    const fakeResult = await fakeRes.json();
    console.log(`   - HTTP Status nhận được: ${fakeRes.status}`);

    if (fakeRes.status === 403 && !fakeResult.success) {
      console.log('   ✅ ĐÃ CHẶN THÀNH CÔNG GIAO DỊCH KHÔNG THUỘC WHITELIST (HTTP 403)!');
      console.log(`   - Mã lỗi: ${fakeResult.code}`);
      console.log(`   - Thông báo: "${fakeResult.error}"`);
    } else {
      throw new Error(`Giao dịch Program ID lạ không bị chặn 403! Status: ${fakeRes.status}`);
    }

    console.log('\n================================================================');
    console.log('🎯 TẤT CẢ CÁC BÀI KIỂM THỬ BẢO MẬT ĐÃ HOÀN TẤT VÀ VƯỢT QUA 100%!');
    console.log('================================================================');
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('\n💥 LỖI KIỂM THỬ:', errorMsg);
    process.exit(1);
  }
}

main();
