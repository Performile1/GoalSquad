/**
 * Shared API authentication helper.
 * Extracts the Bearer JWT from the Authorization header and verifies it
 * against Supabase Auth using the service-role client.
 *
 * Usage:
 *   const user = await getAuthUser(req);
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase';

export async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}
