import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const DEFAULT_SEO_SETTINGS = {
  site_title: 'GoalSquad - Community Commerce',
  site_description: 'GoalSquad hjälper föreningar, klubbar och skolgrupper att finansiera sin verksamhet.',
  site_keywords: [],
  default_og_image: '',
  facebook_url: '',
  twitter_handle: '',
  instagram_handle: '',
  linkedin_url: '',
  google_analytics_id: '',
  google_tag_manager_id: '',
  google_site_verification: '',
  bing_site_verification: '',
  robots_txt_content: '',
  sitemap_enabled: true,
  sitemap_frequency: 'weekly',
};

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { data: settings, error } = await supabaseAdmin
    .from('seo_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Failed to fetch SEO settings' }, { status: 500 });
  return NextResponse.json({ settings: settings || DEFAULT_SEO_SETTINGS });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const { id: _id, updated_at: _updatedAt, ...updates } = body || {};
  const { data: current } = await supabaseAdmin.from('seo_settings').select('id').limit(1).maybeSingle();

  const payload = { ...updates, updated_by: auth.user.id, updated_at: new Date().toISOString() };
  const result = current
    ? await supabaseAdmin.from('seo_settings').update(payload).eq('id', current.id).select('*').single()
    : await supabaseAdmin.from('seo_settings').insert(payload).select('*').single();

  if (result.error) return NextResponse.json({ error: 'Failed to save SEO settings' }, { status: 500 });
  return NextResponse.json({ settings: result.data });
}