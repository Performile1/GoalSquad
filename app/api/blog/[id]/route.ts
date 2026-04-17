import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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
    console.error('Blog GET by ID error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
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
    console.error('Blog PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Blog DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
