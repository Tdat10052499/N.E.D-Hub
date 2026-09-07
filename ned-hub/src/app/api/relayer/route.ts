import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { connection, getAdminKeypair } from '@/lib/solana';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export async function GET() {
  try {
    // 1. Fetch Relayer Settings from Supabase
    let settings = {
      is_active: true,
      daily_limit: 20,
      alert_threshold: 2.0,
      updated_at: new Date().toISOString(),
    };

    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('relayer_settings')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (settingsData && !settingsError) {
      settings = {
        is_active: settingsData.is_active ?? true,
        daily_limit: Number(settingsData.daily_limit ?? 20),
        alert_threshold: Number(settingsData.alert_threshold ?? 2.0),
        updated_at: settingsData.updated_at || new Date().toISOString(),
      };
    }

    // 2. Fetch 50 most recent transactions from relayer_logs
    const { data: logsData, error: logsError } = await supabaseAdmin
      .from('relayer_logs')
      .select('id, wallet_address, username, action, amount_sol, signature, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsError) {
      console.error('Lỗi khi truy vấn relayer_logs:', logsError);
    }

    // 3. Get on-chain balance & public address
    let relayerAddress = 'b7TFMuVZzZneuHSMuoWiV3d52yRF7pLTLVF7HDKNWqz';
    let balance = 19.9998;

    try {
      const adminKeypair = getAdminKeypair();
      relayerAddress = adminKeypair.publicKey.toBase58();
      const lamports = await connection.getBalance(adminKeypair.publicKey);
      balance = lamports / LAMPORTS_PER_SOL;
    } catch (solErr) {
      console.warn('Lỗi RPC getBalance:', solErr);
    }

    return NextResponse.json({
      success: true,
      address: relayerAddress,
      balance,
      settings,
      logs: logsData || [],
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error in GET /api/relayer:', error);
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

    const { data, error } = await supabaseAdmin
      .from('relayer_settings')
      .upsert({
        id: 1,
        is_active: isActive,
        daily_limit: dailyLimit,
        alert_threshold: alertThreshold,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Lỗi khi lưu cấu hình relayer_settings:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình Relayer thành công!',
      settings: data,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error in POST /api/relayer:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
