import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publishedOnly = searchParams.get('published') === 'true';

    let query = supabaseAdmin
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (publishedOnly) {
      query = query.eq('published', true);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    logger.apiError('GET', '/api/blog', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const body = await req.json();
    const { title, content, excerpt, image_url, published } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const { data: post, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        title,
        content,
        excerpt,
        image_url,
        published: published || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    logger.apiError('POST', '/api/blog', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
