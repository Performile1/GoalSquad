import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const campaignSchema = z.object({
  title: z.string().trim().min(1).max(255),
  slug: z.string().trim().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(5000).optional().default(''),
  content: z.string().trim().max(50000).optional().default(''),
  campaign_type: z.enum(['campaign', 'blog', 'landing_page', 'promotion']),
  status: z.enum(['draft', 'published']).default('draft'),
  featured_image_url: z.string().trim().url().max(2000).optional().or(z.literal('')).default(''),
});

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { data: campaigns, error } = await supabaseAdmin
    .from('campaigns')
    .select('id, title, slug, description, campaign_type, status, featured_image_url, published_at, view_count, click_count, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }

  return NextResponse.json({ campaigns: campaigns || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const parsed = campaignSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid campaign data', details: parsed.error.flatten() }, { status: 400 });
  }

  const values = parsed.data;
  const { data: campaign, error } = await supabaseAdmin
    .from('campaigns')
    .insert({
      ...values,
      content: { body: values.content },
      published_at: values.status === 'published' ? new Date().toISOString() : null,
      created_by: auth.user.id,
      updated_by: auth.user.id,
    })
    .select('id, slug')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }

  return NextResponse.json({ campaign }, { status: 201 });
}