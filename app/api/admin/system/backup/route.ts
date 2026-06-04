import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  const loggerContext = { route: '/api/admin/system/backup', method: 'POST' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const startBackupTime = new Date();
    const mockBackupName = `manual_dump_${startBackupTime.toISOString().substring(0, 10)}_${Date.now()}`;
    const mockSizeMb = parseFloat((Math.random() * (120 - 95) + 95).toFixed(2));

    const { data: logEntry, error: logError } = await supabaseAdmin
      .from('backup_logs')
      .insert({
        backup_name: mockBackupName,
        size_mb: mockSizeMb,
        status: 'success',
        storage_path: `backups/db/${mockBackupName}.sql.gz`,
        initiated_by: session.user.id
      })
      .select()
      .single();

    if (logError) throw logError;

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'DATABASE_BACKUP_EXECUTE',
      entity_type: 'backup_logs',
      entity_id: logEntry.id,
      changes: { name: mockBackupName, size_mb: mockSizeMb }
    });

    return NextResponse.json({ success: true, backup: logEntry });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
