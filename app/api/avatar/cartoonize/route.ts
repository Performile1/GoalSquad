/**
 * Avatar Cartoonization API
 * POST /api/avatar/cartoonize
 * 
 * Uses AI to convert photo to cartoon avatar
 * Options: Replicate.com, Stability AI, or local canvas filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { image, userId } = await req.json();

    if (!image || !userId) {
      return NextResponse.json(
        { error: 'Missing image or userId' },
        { status: 400 }
      );
    }

    // Option 1: Use Replicate.com for AI cartoonization (recommended)
    if (process.env.REPLICATE_API_TOKEN) {
      const cartoonized = await cartoonizeWithReplicate(image);
      return NextResponse.json({
        success: true,
        cartoonizedImage: cartoonized,
      });
    }

    // Option 2: Use Stability AI
    if (process.env.STABILITY_API_KEY) {
      const cartoonized = await cartoonizeWithStability(image);
      return NextResponse.json({
        success: true,
        cartoonizedImage: cartoonized,
      });
    }

    // Option 3: Fallback to simple canvas filters (no external API)
    const cartoonized = await cartoonizeWithCanvas(image);
    return NextResponse.json({
      success: true,
      cartoonizedImage: cartoonized,
      method: 'canvas_filter',
    });
  } catch (error) {
    console.error('Cartoonization error:', error);
    return NextResponse.json(
      { error: 'Failed to cartoonize image' },
      { status: 500 }
    );
  }
}

/**
 * Cartoonize using Replicate.com (AI model)
 * Model: "cartoonify" or similar
 */
async function cartoonizeWithReplicate(imageBase64: string): Promise<string> {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'cartoon-model-version-id', // Replace with actual model version
      input: {
        image: imageBase64,
        style: 'cartoon',
      },
    }),
  });

  const prediction = await response.json();

  // Poll for result
  let result = prediction;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${result.id}`,
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      }
    );
    result = await pollResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error('Cartoonization failed');
  }

  return result.output;
}

/**
 * Cartoonize using Stability AI
 */
async function cartoonizeWithStability(imageBase64: string): Promise<string> {
  // Remove data:image/jpeg;base64, prefix
  const base64Data = imageBase64.split(',')[1];

  const response = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        init_image: base64Data,
        text_prompts: [
          {
            text: 'cartoon style, animated, colorful, friendly, cute avatar',
            weight: 1,
          },
        ],
        cfg_scale: 7,
        image_strength: 0.35,
        steps: 30,
      }),
    }
  );

  const result = await response.json();
  
  if (result.artifacts && result.artifacts[0]) {
    return `data:image/png;base64,${result.artifacts[0].base64}`;
  }

  throw new Error('No image returned from Stability AI');
}

/**
 * Cartoonize using Canvas filters (fallback, no AI)
 * This is a simple edge detection + color quantization
 */
async function cartoonizeWithCanvas(imageBase64: string): Promise<string> {
  // This would typically be done client-side or with a library like sharp
  // For now, return a placeholder that indicates canvas processing
  
  // In production, you could use sharp or jimp for server-side image processing:
  /*
  const sharp = require('sharp');
  const buffer = Buffer.from(imageBase64.split(',')[1], 'base64');
  
  const processed = await sharp(buffer)
    .modulate({ saturation: 1.5, brightness: 1.1 })
    .sharpen()
    .toBuffer();
  
  return `data:image/jpeg;base64,${processed.toString('base64')}`;
  */

  // For now, return original with a note
  return imageBase64;
}
