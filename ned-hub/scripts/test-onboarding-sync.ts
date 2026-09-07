import { Connection, Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { connection } from '../src/lib/solana';
import { sendSponsoredTransaction } from '../src/lib/sponsorClient';
import {
  updateUserOnboardingStatus,
  syncMintSuccess,
} from '../src/lib/onboardingSync';
import { supabaseAdmin } from '../src/lib/supabase';

const BASE_URL = 'http://localhost:3000';

async function runOnboardingSyncTests() {
  console.log('================================================================');
  console.log('🔄 BẮT ĐẦU KIỂM THỬ ĐỒNG BỘ PHỄU ONBOARDING LÊN SUPABASE');
  console.log('🌐 Server API:', BASE_URL);
  console.log('================================================================\n');

  // Khởi tạo ví người dùng giả lập
  const testUser = Keypair.generate();
  const walletAddress = testUser.publicKey.toBase58();
  console.log(`👤 Tạo người dùng kiểm thử (Ví Solana): ${walletAddress}\n`);

  try {
    // ----------------------------------------------------
    // GIAI ĐOẠN 1: Người dùng bắt đầu Auth
    // ----------------------------------------------------
    console.log('📌 [BƯỚC 1] Ghi nhận trạng thái: auth ...');
    const authRes = await updateUserOnboardingStatus(
      walletAddress,
      'auth',
      { phone_hash: 'sha256_mock_0987654321' },
      BASE_URL
    );
    if (!authRes.success) throw new Error(`Lỗi Bước 1: ${authRes.error}`);
    console.log(`✅ [Giai đoạn 1: auth] Thành công! User ID: ${authRes.data?.id}`);

    // ----------------------------------------------------
    // GIAI ĐOẠN 2: Người dùng xác thực OTP thành công
    // ----------------------------------------------------
    console.log('\n📌 [BƯỚC 2] Cập nhật trạng thái: otp_verified ...');
    const otpRes = await updateUserOnboardingStatus(
      walletAddress,
      'otp_verified',
      {},
      BASE_URL
    );
    if (!otpRes.success) throw new Error(`Lỗi Bước 2: ${otpRes.error}`);
    console.log(`✅ [Giai đoạn 2: otp_verified] Thành công! Status: ${otpRes.data?.onboarding_status}`);

    // ----------------------------------------------------
    // GIAI ĐOẠN 3: Người dùng chọn tên ví (username)
    // ----------------------------------------------------
    console.log('\n📌 [BƯỚC 3] Cập nhật trạng thái: name_selected (username: alex.ned) ...');
    const nameRes = await updateUserOnboardingStatus(
      walletAddress,
      'name_selected',
      { username: 'alex.ned' },
      BASE_URL
    );
    if (!nameRes.success) throw new Error(`Lỗi Bước 3: ${nameRes.error}`);
    console.log(`✅ [Giai đoạn 3: name_selected] Thành công! Username: ${nameRes.data?.username}`);

    // ----------------------------------------------------
    // GIAI ĐOẠN 4: Tài trợ Gas Relayer + Mint on-chain + Đồng bộ 'minted'
    // ----------------------------------------------------
    console.log('\n📌 [BƯỚC 4] Gửi giao dịch On-chain qua Relayer Gasless và chuyển sang minted...');
    const recipient = Keypair.generate();
    const mintTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: testUser.publicKey,
        toPubkey: recipient.publicKey,
        lamports: 0,
      })
    );

    // Gửi qua sponsorClient
    const sponsorResult = await sendSponsoredTransaction(connection, mintTx, testUser, {
      apiUrl: `${BASE_URL}/api/sponsor-tx`,
      relayerBalanceApiUrl: `${BASE_URL}/api/relayer-balance`,
    });

    console.log(`   - Giao dịch on-chain thành công! Signature: ${sponsorResult.signature}`);

    // Đồng bộ trạng thái 'minted' kèm signature
    const mintSyncRes = await syncMintSuccess(
      walletAddress,
      sponsorResult.signature,
      { username: 'alex.ned' },
      BASE_URL
    );

    if (!mintSyncRes.success) throw new Error(`Lỗi Bước 4: ${mintSyncRes.error}`);
    console.log(`✅ [Giai đoạn 4: minted] Thành công! Onboarding Status: ${mintSyncRes.data?.onboarding_status}`);

    // ----------------------------------------------------
    // GIAI ĐOẠN 5: Kiểm tra lại API /api/funnel-stats
    // ----------------------------------------------------
    console.log('\n📊 [BƯỚC 5] Kiểm tra endpoint /api/funnel-stats sau khi đồng bộ...');
    const statsRes = await fetch(`${BASE_URL}/api/funnel-stats`);
    const statsData = await statsRes.json();
    console.log('   - Dữ liệu phễu hiện tại:', statsData.data);

    // Dọn dẹp dữ liệu kiểm thử
    console.log('\n🧹 Dọn dẹp bản ghi kiểm thử trên Supabase...');
    await supabaseAdmin.from('users').delete().eq('wallet_address', walletAddress);
    console.log('✅ Đã dọn dẹp sạch sẽ!');

    console.log('\n================================================================');
    console.log('🎉 TẤT CẢ CÁC BƯỚC ĐỒNG BỘ PHỄU ONBOARDING ĐÃ HOÀN TẤT THÀNH CÔNG!');
    console.log('================================================================');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('\n❌ KIỂM THỬ THẤT BẠI:', errorMsg);

    // Cleanup on error
    await supabaseAdmin.from('users').delete().eq('wallet_address', walletAddress);
    process.exit(1);
  }
}

runOnboardingSyncTests();
