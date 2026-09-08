import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ─── GET: Xuất toàn bộ dữ liệu hệ thống ra tệp JSON ─────────────────────────

export async function GET() {
  try {
    // 1. Query all tables from Supabase in parallel
    const [usersRes, miniappsRes, relayerSettingsRes, relayerLogsRes, systemControlsRes] =
      await Promise.all([
        supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('miniapps').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('relayer_settings').select('*').eq('id', 1).single(),
        supabaseAdmin.from('relayer_logs').select('*').order('created_at', { ascending: false }).limit(200),
        supabaseAdmin.from('system_controls').select('*').eq('id', 1).single(),
      ]);

    const users = usersRes.data || [];
    const miniapps = miniappsRes.data || [];
    const relayerSettings = relayerSettingsRes.data || null;
    const relayerLogs = relayerLogsRes.data || [];
    const systemControls = systemControlsRes.data || null;

    // 2. Build backup payload with full metadata
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const filename = `ned-wallet-backup-${day}-${month}-${year}_${hours}-${minutes}.json`;

    const backupPayload = {
      backup_version: "2.0.0",
      export_timestamp: now.toISOString(),
      platform: "N.E.D-Hub System Admin",
      environment: "Solana Devnet",
      summary: {
        total_users: users.length,
        total_miniapps: miniapps.length,
        has_relayer_settings: !!relayerSettings,
        total_relayer_logs: relayerLogs.length,
        exported_at: now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      },
      tables: {
        users,
        miniapps,
        relayer_settings: relayerSettings ? [relayerSettings] : [],
        relayer_logs: relayerLogs,
        system_controls: systemControls ? [systemControls] : [],
      },
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);

    // 3. Return JSON as file attachment
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    console.error('API /api/system/backup GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tạo bản sao lưu dữ liệu hệ thống' },
      { status: 500 }
    );
  }
}

// ─── POST: Phục hồi (Restore / Upsert) dữ liệu từ tệp JSON vào Supabase ───────

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu sao lưu không hợp lệ' },
        { status: 400 }
      );
    }

    // Extract table data (supporting both { tables: { ... } } and direct keys)
    const tables = payload.tables || payload;
    const users = Array.isArray(tables.users) ? tables.users : [];
    const miniapps = Array.isArray(tables.miniapps) ? tables.miniapps : [];
    const relayerSettings = Array.isArray(tables.relayer_settings)
      ? tables.relayer_settings[0]
      : tables.relayer_settings || null;
    const relayerLogs = Array.isArray(tables.relayer_logs) ? tables.relayer_logs : [];
    const systemControls = Array.isArray(tables.system_controls)
      ? tables.system_controls[0]
      : tables.system_controls || null;

    const restoreSummary = {
      users_restored: 0,
      miniapps_restored: 0,
      relayer_settings_restored: false,
      relayer_logs_restored: 0,
      system_controls_restored: false,
      warnings: [] as string[],
    };

    // 1. Restore users
    if (users.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .upsert(users, { onConflict: 'id' })
        .select();

      if (error) {
        console.warn('Restore users warning:', error.message);
        restoreSummary.warnings.push(`Users: ${error.message}`);
      } else {
        restoreSummary.users_restored = data?.length || users.length;
      }
    }

    // 2. Restore miniapps
    if (miniapps.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('miniapps')
        .upsert(miniapps, { onConflict: 'id' })
        .select();

      if (error) {
        console.warn('Restore miniapps warning:', error.message);
        restoreSummary.warnings.push(`MiniApps: ${error.message}`);
      } else {
        restoreSummary.miniapps_restored = data?.length || miniapps.length;
      }
    }

    // 3. Restore relayer_settings
    if (relayerSettings && typeof relayerSettings === 'object') {
      const { error } = await supabaseAdmin
        .from('relayer_settings')
        .upsert({ ...relayerSettings, id: 1 }, { onConflict: 'id' });

      if (error) {
        console.warn('Restore relayer_settings warning:', error.message);
        restoreSummary.warnings.push(`Relayer Settings: ${error.message}`);
      } else {
        restoreSummary.relayer_settings_restored = true;
      }
    }

    // 4. Restore system_controls
    if (systemControls && typeof systemControls === 'object') {
      const { error } = await supabaseAdmin
        .from('system_controls')
        .upsert({ ...systemControls, id: 1 }, { onConflict: 'id' });

      if (error) {
        console.warn('Restore system_controls warning:', error.message);
      } else {
        restoreSummary.system_controls_restored = true;
      }
    }

    // 5. Restore relayer_logs (optional batch insert)
    if (relayerLogs.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('relayer_logs')
        .upsert(relayerLogs, { onConflict: 'id' })
        .select();

      if (!error) {
        restoreSummary.relayer_logs_restored = data?.length || relayerLogs.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Khôi phục toàn vẹn dữ liệu hệ thống thành công!',
      summary: restoreSummary,
    });
  } catch (err: unknown) {
    console.error('API /api/system/backup POST restore error:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi server trong quá trình khôi phục bản sao lưu' },
      { status: 500 }
    );
  }
}
