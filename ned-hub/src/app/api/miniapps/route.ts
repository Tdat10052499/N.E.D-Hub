import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Fallback seed apps if Supabase miniapps table is empty or uninitialized
const fallbackMiniApps = [
  {
    id: "app-1",
    icon: "🎟️",
    icon_gradient: "linear-gradient(135deg, #9945FF 0%, #6366F1 100%)",
    title: "Event Ticket & Check-in",
    builder_name: "Tech4life Foundation",
    builder_avatar: "TF",
    description: "Ứng dụng quét vé mã QR siêu tốc, tự động xác thực chữ ký ví và cấp NFT Badge tham dự sự kiện Tech4life on-chain.",
    version: "v1.4.2",
    category: "Ticketing & Access",
    active_users: "1,420 users",
    is_visible: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "app-2",
    icon: "🎁",
    icon_gradient: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
    title: "Rewards & Airdrop Portal",
    builder_name: "Solana Superteam VN",
    builder_avatar: "SV",
    description: "Cổng phân phối quà tặng token và voucher điện tử cho người dùng hoàn thành nhiệm vụ tham quan gian hàng triển lãm.",
    version: "v2.1.0",
    category: "Airdrop & Loyalty",
    active_users: "980 users",
    is_visible: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "app-3",
    icon: "💳",
    icon_gradient: "linear-gradient(135deg, #10B981 0%, #14F195 100%)",
    title: "Zero-Gas Solana Pay",
    builder_name: "N.E.D Core Labs",
    builder_avatar: "NC",
    description: "Cổng thanh toán QR Code Solana Pay tức thì không tốn phí gas thông qua cơ chế tài trợ tự động của trạm Relayer N.E.D.",
    version: "v1.0.8",
    category: "Web3 Payments",
    active_users: "2,350 users",
    is_visible: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "app-4",
    icon: "🆔",
    icon_gradient: "linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)",
    title: "NFT Identity Minter",
    builder_name: "N.E.D Identity Hub",
    builder_avatar: "ID",
    description: "Tiện ích đúc thẻ định danh cá nhân Web3 Pass dưới dạng Compressed NFT tốc độ cao, liên kết trực tiếp tên miền .ned.",
    version: "v1.2.5",
    category: "Identity & Pass",
    active_users: "860 users",
    is_visible: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "app-5",
    icon: "⚡",
    icon_gradient: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
    title: "Instant Token Swap",
    builder_name: "Jupiter SDK Aggregator",
    builder_avatar: "JP",
    description: "Tiện ích hoán đổi token SOL, USDC và SPL Token tức thì với tỷ giá tối ưu nhất trên toàn bộ hệ sinh thái Solana.",
    version: "v3.0.1",
    category: "DeFi & Swap",
    active_users: "3,120 users",
    is_visible: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "app-6",
    icon: "🤖",
    icon_gradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
    title: "AI Wallet Copilot",
    builder_name: "DeepMind Web3 Studio",
    builder_avatar: "DM",
    description: "Trợ lý trí tuệ nhân tạo phân tích giao dịch on-chain, cảnh báo rủi ro hợp đồng thông minh và tối ưu hóa chi phí.",
    version: "v1.1.0",
    category: "AI & Analytics",
    active_users: "1,780 users",
    is_visible: true,
    created_at: new Date().toISOString(),
  },
];

// In-memory fallback state in case Supabase table is not yet created
let memoryApps = [...fallbackMiniApps];

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('miniapps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase miniapps query error (using fallback):', error.message);
      return NextResponse.json({
        success: true,
        data: memoryApps,
        source: 'fallback',
      });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: memoryApps,
        source: 'fallback_empty',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'supabase',
    });
  } catch (err: unknown) {
    console.error('API /api/miniapps GET error:', err);
    return NextResponse.json(
      { success: true, data: memoryApps, source: 'fallback_exception' },
      { status: 200 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, is_visible } = body;

    if (!id || typeof is_visible !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Thiếu hoặc sai định dạng trường id và is_visible' },
        { status: 400 }
      );
    }

    // Attempt updating in Supabase miniapps table
    const { data, error } = await supabaseAdmin
      .from('miniapps')
      .update({ is_visible })
      .eq('id', id)
      .select();

    // Also update in-memory fallback state
    memoryApps = memoryApps.map((app) =>
      app.id === id ? { ...app, is_visible } : app
    );

    if (error) {
      console.warn('Supabase miniapps update warning:', error.message);
      // Return success with memory updated so UI keeps working smoothly
      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật trạng thái Mini-App (fallback/memory)',
        data: { id, is_visible },
        source: 'memory',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật trạng thái Mini-App trên Supabase!',
      data,
      source: 'supabase',
    });
  } catch (err: unknown) {
    console.error('API /api/miniapps PATCH error:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi server khi cập nhật trạng thái Mini-App' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return PATCH(request);
}
