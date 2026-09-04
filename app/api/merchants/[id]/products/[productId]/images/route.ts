import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string; productId: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: merchant } = await supabaseAdmin.from('merchants').select('user_id').eq('id', params.id).maybeSingle();
  if (merchant?.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: product } = await supabaseAdmin.from('products').select('id, images, image_url').eq('id', params.productId).eq('merchant_id', params.id).maybeSingle();
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Image file required' }, { status: 400 });
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return NextResponse.json({ error: 'Only JPG, PNG or WebP images are supported' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Image must be smaller than 5 MB' }, { status: 400 });

  const path = `${params.id}/${params.productId}/${crypto.randomUUID()}.${file.type.split('/')[1]}`;
  const { error: uploadError } = await supabaseAdmin.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: 'Could not upload image. Check the product-images bucket.' }, { status: 502 });

  const { data: publicUrl } = supabaseAdmin.storage.from('product-images').getPublicUrl(path);
  const images = Array.isArray(product.images) ? product.images : product.image_url ? [product.image_url] : [];
  const nextImages = [...images, publicUrl.publicUrl];
  const { error: updateError } = await supabaseAdmin.from('products').update({ images: nextImages, image_url: product.image_url || publicUrl.publicUrl, updated_at: new Date().toISOString() }).eq('id', product.id);
  if (updateError) return NextResponse.json({ error: 'Image uploaded but product could not be updated' }, { status: 500 });

  return NextResponse.json({ imageUrl: publicUrl.publicUrl, images: nextImages }, { status: 201 });
}
