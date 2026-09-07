import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export interface UserSchema {
  id: string;
  username: string | null;
  wallet_address: string | null;
  onboarding_status: string;
  created_at: string;
}

export async function GET() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, wallet_address, onboarding_status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi khi truy vấn danh sách users từ Supabase:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (users || []) as UserSchema[],
      total: users?.length || 0,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Lỗi trong /api/users:', error);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
