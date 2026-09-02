import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: post, error } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    logger.apiError('GET', '/api/blog/[id]', error as Error, { postId: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const body = await req.json();
    const { title, content, excerpt, image_url, published } = body;

    const { data: post, error } = await supabaseAdmin
      .from('blog_posts')
      .update({
        title,
        content,
        excerpt,
        image_url,
        published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    logger.apiError('PUT', '/api/blog/[id]', error as Error, { postId: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError('DELETE', '/api/blog/[id]', error as Error, { postId: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
