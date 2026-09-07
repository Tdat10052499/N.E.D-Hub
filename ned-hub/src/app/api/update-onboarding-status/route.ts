import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, newStatus, extraData } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu trường walletAddress hợp lệ' },
        { status: 400 }
      );
    }

    const validStatuses = ['auth', 'otp_verified', 'name_selected', 'minted'];
    if (!newStatus || !validStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Trạng thái newStatus '${newStatus}' không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      wallet_address: walletAddress.trim(),
      onboarding_status: newStatus,
      ...(extraData?.username ? { username: extraData.username } : {}),
      ...(extraData?.phone_hash ? { phone_hash: extraData.phone_hash } : {}),
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(payload, { onConflict: 'wallet_address' })
      .select();

    if (error) {
      console.error('Lỗi khi upsert vào bảng users trên Supabase:', error);
      return NextResponse.json(
        { success: false, error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.[0] || null,
      message: `Đã cập nhật trạng thái phễu người dùng sang '${newStatus}'`,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Lỗi trong /api/update-onboarding-status:', error);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
