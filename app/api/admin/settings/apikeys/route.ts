import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { randomBytes, createHash } from 'crypto';
import { requireAdmin } from '@/lib/api-auth';

export async function POST(request: Request) {
  const loggerContext = { route: '/api/admin/settings/apikeys', method: 'POST' };

  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 });

    const prefix = 'pk_live_';
    const secretPart = randomBytes(24).toString('hex');
    const fullKey = `${prefix}${secretPart}`;
    
    const hashedKey = createHash('sha256').update(fullKey).digest('hex');
    const maskedKey = `${prefix}************${fullKey.slice(-4)}`;

    const { data: apiKeyRecord, error: dbError } = await supabaseAdmin
      .from('api_keys')
      .insert({
        name,
        key_prefix: prefix,
        hashed_key: hashedKey,
        masked_key: maskedKey,
        created_by: auth.user.id
      })
      .select()
      .single();

    if (dbError) throw dbError;

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: auth.user.id,
      action: 'API_KEY_GENERATE',
      entity_type: 'api_keys',
      entity_id: apiKeyRecord.id,
      changes: { name, masked_key: maskedKey }
    });

    return NextResponse.json({
      success: true,
      apiKey: fullKey,
      metadata: apiKeyRecord
    });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET() {
  const loggerContext = { route: '/api/admin/settings/apikeys', method: 'GET' };

  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { data: apiKeys, error } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, keys: apiKeys || [] });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
