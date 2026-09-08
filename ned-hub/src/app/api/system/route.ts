import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// In-memory fallback if system_controls table does not exist or column has not been added yet
let memorySystemControls = {
  id: 1,
  maintenance_mode: false,
  announcement_text: "",
  announcement_type: "info" as "info" | "warning" | "emergency",
  solana_network: "devnet" as "devnet" | "mainnet-beta",
  updated_at: new Date().toISOString(),
};

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_controls')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      console.warn('Supabase system_controls GET query warning (using fallback):', error?.message);
      return NextResponse.json({
        success: true,
        data: memorySystemControls,
        source: 'memory_fallback',
      });
    }

    // Update memory cache
    memorySystemControls = {
      id: data.id ?? 1,
      maintenance_mode: data.maintenance_mode ?? false,
      announcement_text: data.announcement_text ?? "",
      announcement_type: data.announcement_type ?? "info",
      solana_network: data.solana_network === 'mainnet-beta' ? 'mainnet-beta' : 'devnet',
      updated_at: data.updated_at ?? new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: memorySystemControls,
      source: 'supabase',
    });
  } catch (err: unknown) {
    console.error('API /api/system GET error:', err);
    return NextResponse.json({
      success: true,
      data: memorySystemControls,
      source: 'memory_exception',
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { maintenance_mode, announcement_text, announcement_type, solana_network } = body;

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof maintenance_mode === 'boolean') {
      updatePayload.maintenance_mode = maintenance_mode;
      memorySystemControls.maintenance_mode = maintenance_mode;
    }

    if (typeof announcement_text === 'string') {
      updatePayload.announcement_text = announcement_text;
      memorySystemControls.announcement_text = announcement_text;
    }

    if (typeof announcement_type === 'string') {
      updatePayload.announcement_type = announcement_type as "info" | "warning" | "emergency";
      memorySystemControls.announcement_type = announcement_type as "info" | "warning" | "emergency";
    }

    if (typeof solana_network === 'string') {
      const validNetwork = solana_network === 'mainnet-beta' ? 'mainnet-beta' : 'devnet';
      updatePayload.solana_network = validNetwork;
      memorySystemControls.solana_network = validNetwork;
    }

    memorySystemControls.updated_at = updatePayload.updated_at;

    // Try updating Supabase
    const { data, error } = await supabaseAdmin
      .from('system_controls')
      .update(updatePayload)
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      console.warn('Supabase system_controls update warning (updated in memory):', error.message);
      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật cấu hình hệ thống (Bộ nhớ tạm)!',
        data: memorySystemControls,
        source: 'memory',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật cấu hình hệ thống trên Supabase thành công!',
      data: data || memorySystemControls,
      source: 'supabase',
    });
  } catch (err: unknown) {
    console.error('API /api/system PATCH error:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi server khi cập nhật cấu hình hệ thống' },
      { status: 500 }
    );
  }
}
