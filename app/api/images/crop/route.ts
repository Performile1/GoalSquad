/**
 * Image Crop API
 * POST /api/images/crop
 * 
 * Crop images with specified aspect ratio
 */

import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const aspectRatio = formData.get('aspectRatio') as string || 'free';
    const x = parseInt(formData.get('x') as string || '0');
    const y = parseInt(formData.get('y') as string || '0');
    const width = parseInt(formData.get('width') as string || '0');
    const height = parseInt(formData.get('height') as string || '0');

    if (!image) {
      return NextResponse.json(
        { error: 'Image required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    let processedBuffer: Buffer;

    if (width > 0 && height > 0) {
      // Manual crop with coordinates
      processedBuffer = await sharp(buffer)
        .extract({ left: x, top: y, width, height })
        .toBuffer();
    } else {
      // Auto-crop based on aspect ratio
      const metadata = await sharp(buffer).metadata();
      const originalWidth = metadata.width!;
      const originalHeight = metadata.height!;

      let cropWidth = originalWidth;
      let cropHeight = originalHeight;
      let cropX = 0;
      let cropY = 0;

      switch (aspectRatio) {
        case '1:1':
          // Square
          const size = Math.min(originalWidth, originalHeight);
          cropWidth = size;
          cropHeight = size;
          cropX = Math.floor((originalWidth - size) / 2);
          cropY = Math.floor((originalHeight - size) / 2);
          break;
        case '16:9':
          // Widescreen
          if (originalWidth / originalHeight > 16 / 9) {
            cropWidth = Math.floor(originalHeight * (16 / 9));
            cropX = Math.floor((originalWidth - cropWidth) / 2);
          } else {
            cropHeight = Math.floor(originalWidth / (16 / 9));
            cropY = Math.floor((originalHeight - cropHeight) / 2);
          }
          break;
        case '4:3':
          // Standard
          if (originalWidth / originalHeight > 4 / 3) {
            cropWidth = Math.floor(originalHeight * (4 / 3));
            cropX = Math.floor((originalWidth - cropWidth) / 2);
          } else {
            cropHeight = Math.floor(originalWidth / (4 / 3));
            cropY = Math.floor((originalHeight - cropHeight) / 2);
          }
          break;
        default:
          // Free - no crop
          processedBuffer = buffer;
      }

      if (aspectRatio !== 'free') {
        processedBuffer = await sharp(buffer)
          .extract({ left: cropX, top: cropY, width: cropWidth, height: cropHeight })
          .toBuffer();
      }
    }

    // Upload to Supabase Storage
    const fileName = `cropped-${Date.now()}.jpg`;
    const { data, error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(fileName, processedBuffer!, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;

    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Crop error:', error);
    return NextResponse.json(
      { error: 'Failed to crop image' },
      { status: 500 }
    );
  }
}
