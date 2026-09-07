import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('relayer_settings')
      .select('id, is_active, daily_limit, alert_threshold, updated_at')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('Lỗi khi truy vấn relayer_settings:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Default fallback if table is empty
    const settings = data || {
      id: 1,
      is_active: true,
      daily_limit: 20,
      alert_threshold: 2.0,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        is_active: settings.is_active ?? true,
        daily_limit: Number(settings.daily_limit ?? 20),
        alert_threshold: Number(settings.alert_threshold ?? 2.0),
        updated_at: settings.updated_at || new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error in GET /api/relayer-settings:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const isActive = body.is_active !== undefined ? Boolean(body.is_active) : true;
    const dailyLimit = body.daily_limit !== undefined ? Number(body.daily_limit) : 20;
    const alertThreshold = body.alert_threshold !== undefined ? Number(body.alert_threshold) : 2.0;

    // Use upsert on id = 1 so it updates if exists, or inserts if missing
    const { data, error } = await supabaseAdmin
      .from('relayer_settings')
      .upsert({
        id: 1,
        is_active: isActive,
        daily_limit: dailyLimit,
        alert_threshold: alertThreshold,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      console.error('Lỗi khi cập nhật relayer_settings:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình Relayer thành công!',
      data: {
        is_active: data.is_active,
        daily_limit: Number(data.daily_limit),
        alert_threshold: Number(data.alert_threshold),
        updated_at: data.updated_at,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error in POST /api/relayer-settings:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
