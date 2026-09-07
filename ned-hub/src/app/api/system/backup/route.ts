import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Query all users from Supabase
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.warn('Backup: users query error:', usersError.message);
    }

    // 2. Query all relayer logs from Supabase
    const { data: relayerLogsData, error: logsError } = await supabaseAdmin
      .from('relayer_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (logsError) {
      console.warn('Backup: relayer_logs query error:', logsError.message);
    }

    const users = usersData || [];
    const relayerLogs = relayerLogsData || [];

    // 3. Assemble JSON backup archive
    const backupPayload = {
      backup_version: "2.0.0",
      export_timestamp: new Date().toISOString(),
      platform: "N.E.D-Hub Admin Console",
      cluster: "Solana Devnet",
      summary: {
        total_users: users.length,
        total_relayer_logs: relayerLogs.length,
        generated_at: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      },
      users: users,
      relayer_logs: relayerLogs,
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `backup-${dateStr}.json`;

    // 4. Return as downloadable file attachment
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    console.error('API /api/system/backup error:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tạo bản sao lưu dữ liệu hệ thống' },
      { status: 500 }
    );
  }
}
