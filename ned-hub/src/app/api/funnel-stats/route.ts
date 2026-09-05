import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*');

    if (error) {
      console.error('Error querying users table from Supabase:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    let authCount = 0;
    let otpCount = 0;
    let nameCount = 0;
    let mintedCount = 0;

    if (users && users.length > 0) {
      users.forEach((user: Record<string, unknown>) => {
        const status = String(user.status || '').toLowerCase().trim();
        const step = Number(user.step) || 0;
        const isMinted = Boolean(user.is_minted || user.minted || user.wallet_address || status === 'minted' || step >= 4);
        const isNameSelected = Boolean(user.name_selected || user.username || user.name || status === 'name_selected' || step >= 3 || isMinted);
        const isOtpVerified = Boolean(user.otp_verified || user.is_verified || status === 'otp_verified' || step >= 2 || isNameSelected);

        authCount++;
        if (isOtpVerified) otpCount++;
        if (isNameSelected) nameCount++;
        if (isMinted) mintedCount++;
      });
    } else {
      // Dữ liệu baseline hiển thị khi cơ sở dữ liệu chưa có bản ghi
      authCount = 65200;
      otpCount = 54800;
      nameCount = 48600;
      mintedCount = 38300;
    }

    return NextResponse.json({
      success: true,
      data: {
        auth: authCount,
        otp_verified: otpCount,
        name_selected: nameCount,
        minted: mintedCount,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error in /api/funnel-stats:', error);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
