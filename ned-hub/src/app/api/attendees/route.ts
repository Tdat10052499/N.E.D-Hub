import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export interface AttendeeRecord {
  id: string;
  name: string;
  wallet_address: string;
  status: 'auth' | 'otp_verified' | 'name_selected' | 'minted';
  created_at: string;
}

export async function GET() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi khi truy vấn danh sách attendees từ Supabase:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Chuẩn hóa dữ liệu tương thích với bảng hiển thị
    const attendees: AttendeeRecord[] = (users || []).map((user: Record<string, unknown>) => {
      const rawStatus = String(
        user.onboarding_status || user.status || 'auth'
      ).toLowerCase().trim();

      let status: 'auth' | 'otp_verified' | 'name_selected' | 'minted' = 'auth';
      if (rawStatus === 'minted' || rawStatus === 'completed' || user.is_minted) {
        status = 'minted';
      } else if (rawStatus === 'name_selected' || rawStatus === 'name_created') {
        status = 'name_selected';
      } else if (rawStatus === 'otp_verified' || rawStatus === 'verified') {
        status = 'otp_verified';
      }

      return {
        id: String(user.id || ''),
        name: String(user.username || user.name || 'Khách chưa đặt tên'),
        wallet_address: String(user.wallet_address || 'Chưa liên kết ví'),
        status,
        created_at: String(user.created_at || new Date().toISOString()),
      };
    });

    return NextResponse.json({
      success: true,
      data: attendees,
      total: attendees.length,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Lỗi trong /api/attendees:', error);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
