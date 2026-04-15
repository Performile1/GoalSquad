/**
 * Remove Background API
 * POST /api/images/remove-background
 * 
 * Uses remove.bg or similar service to remove image background
 */

import { NextRequest, NextResponse } from 'next/server';
import FormData from 'form-data';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'Image required' },
        { status: 400 }
      );
    }

    // Option 1: Use remove.bg API (requires API key)
    if (process.env.REMOVE_BG_API_KEY) {
      return await removeBackgroundWithRemoveBg(image);
    }

    // Option 2: Use Cloudinary (requires setup)
    if (process.env.CLOUDINARY_URL) {
      return await removeBackgroundWithCloudinary(image);
    }

    // Option 3: Use local processing (basic)
    return await removeBackgroundLocal(image);
  } catch (error) {
    console.error('Remove background error:', error);
    return NextResponse.json(
      { error: 'Failed to remove background' },
      { status: 500 }
    );
  }
}

// Option 1: remove.bg API
async function removeBackgroundWithRemoveBg(image: File) {
  const formData = new FormData();
  const buffer = Buffer.from(await image.arrayBuffer());
  formData.append('image_file', buffer, {
    filename: image.name,
    contentType: image.type,
  });
  formData.append('size', 'auto');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.REMOVE_BG_API_KEY!,
    },
    body: formData as any,
  });

  if (!response.ok) {
    throw new Error('remove.bg API failed');
  }

  const resultBuffer = Buffer.from(await response.arrayBuffer());
  
  // Upload to Supabase Storage
  const fileName = `processed-${Date.now()}.png`;
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, resultBuffer, {
      contentType: 'image/png',
      upsert: false,
    });

  if (error) throw error;

  const imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;

  return NextResponse.json({ imageUrl });
}

// Option 2: Cloudinary
async function removeBackgroundWithCloudinary(image: File) {
  const cloudinary = require('cloudinary').v2;
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const buffer = Buffer.from(await image.arrayBuffer());
  const base64Image = `data:${image.type};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(base64Image, {
    background_removal: 'cloudinary_ai',
    folder: 'goalsquad/processed',
  });

  return NextResponse.json({ imageUrl: result.secure_url });
}

// Option 3: Local processing with Sharp
async function removeBackgroundLocal(image: File) {
  const { removeBackgroundLocal, smartCrop, enhanceProductImage } = await import('@/lib/image-processing');
  
  const buffer = Buffer.from(await image.arrayBuffer());
  
  // Remove background using Sharp
  let processedBuffer = await removeBackgroundLocal(buffer);
  
  // Smart crop to content
  processedBuffer = await smartCrop(processedBuffer);
  
  // Enhance image quality
  processedBuffer = await enhanceProductImage(processedBuffer);
  
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const fileName = `processed-${Date.now()}.png`;
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, processedBuffer, {
      contentType: 'image/png',
      upsert: false,
    });

  if (error) throw error;

  const imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;

  return NextResponse.json({ 
    imageUrl,
    method: 'local_sharp',
    note: 'Background removed using local processing'
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
