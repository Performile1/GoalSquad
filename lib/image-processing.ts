/**
 * Local Image Processing with Sharp
 * 
 * Background removal using Sharp + simple ML techniques
 * No external API required
 */

import sharp from 'sharp';

/**
 * Remove background using Sharp's threshold and edge detection
 * This is a simple implementation - for better results, use remove.bg API
 */
export async function removeBackgroundLocal(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Method 1: Simple threshold-based removal (works for solid backgrounds)
    const processed = await image
      .ensureAlpha() // Add alpha channel if not present
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = processed;
    const pixels = new Uint8ClampedArray(data);
    const channels = info.channels;

    // Simple background detection (assumes white/light background)
    // This is a basic implementation - for production, consider using:
    // - TensorFlow.js with BodyPix or similar model
    // - OpenCV.js
    // - External API (remove.bg, Cloudinary)

    const threshold = 240; // Brightness threshold for background
    const tolerance = 20; // Color tolerance

    for (let i = 0; i < pixels.length; i += channels) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Calculate brightness
      const brightness = (r + g + b) / 3;

      // If pixel is close to white/background color, make it transparent
      if (brightness > threshold) {
        const colorVariance = Math.max(
          Math.abs(r - g),
          Math.abs(g - b),
          Math.abs(r - b)
        );

        // If color is uniform (low variance), it's likely background
        if (colorVariance < tolerance) {
          pixels[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
    }

    // Convert back to PNG
    const result = await sharp(Buffer.from(pixels), {
      raw: {
        width: info.width,
        height: info.height,
        channels: channels,
      },
    })
      .png()
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Background removal error:', error);
    throw error;
  }
}

/**
 * Advanced background removal using edge detection
 */
export async function removeBackgroundAdvanced(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer);

    // Step 1: Convert to grayscale for edge detection
    const edges = await image
      .clone()
      .greyscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1], // Edge detection kernel
      })
      .toBuffer();

    // Step 2: Create mask from edges
    const mask = await sharp(edges)
      .threshold(50) // Adjust threshold as needed
      .negate() // Invert mask
      .toBuffer();

    // Step 3: Apply mask to original image
    const result = await image
      .composite([
        {
          input: mask,
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Advanced background removal error:', error);
    throw error;
  }
}

/**
 * Smart crop - automatically crop to content bounds
 */
export async function smartCrop(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const result = await sharp(imageBuffer)
      .trim({
        background: { r: 255, g: 255, b: 255 }, // Trim white background
        threshold: 10, // Tolerance
      })
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Smart crop error:', error);
    throw error;
  }
}

/**
 * Enhance product image (brightness, contrast, sharpness)
 */
export async function enhanceProductImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const result = await sharp(imageBuffer)
      .normalize() // Auto-adjust brightness/contrast
      .sharpen() // Sharpen edges
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Image enhancement error:', error);
    throw error;
  }
}

/**
 * Create thumbnail with white background
 */
export async function createThumbnail(
  imageBuffer: Buffer,
  size: number = 300
): Promise<Buffer> {
  try {
    const result = await sharp(imageBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    throw error;
  }
}

/**
 * Optimize image for web (compress, resize if too large)
 */
export async function optimizeForWeb(
  imageBuffer: Buffer,
  maxWidth: number = 1920,
  quality: number = 85
): Promise<Buffer> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    let pipeline = sharp(imageBuffer);

    // Resize if too large
    if (metadata.width && metadata.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Optimize based on format
    if (metadata.format === 'png') {
      return await pipeline
        .png({ quality, compressionLevel: 9 })
        .toBuffer();
    } else {
      return await pipeline
        .jpeg({ quality, progressive: true })
        .toBuffer();
    }
  } catch (error) {
    console.error('Image optimization error:', error);
    throw error;
  }
}

/**
 * Convert image to WebP format (better compression)
 */
export async function convertToWebP(
  imageBuffer: Buffer,
  quality: number = 85
): Promise<Buffer> {
  try {
    const result = await sharp(imageBuffer)
      .webp({ quality })
      .toBuffer();

    return result;
  } catch (error) {
    console.error('WebP conversion error:', error);
    throw error;
  }
}

/**
 * Add watermark to image
 */
export async function addWatermark(
  imageBuffer: Buffer,
  watermarkBuffer: Buffer,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' = 'bottom-right',
  opacity: number = 0.5
): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Resize watermark to 20% of image width
    const watermarkWidth = Math.floor((metadata.width || 1000) * 0.2);
    const watermark = await sharp(watermarkBuffer)
      .resize(watermarkWidth, null, { fit: 'inside' })
      .toBuffer();

    const watermarkMetadata = await sharp(watermark).metadata();

    // Calculate position
    let left = 0;
    let top = 0;

    switch (position) {
      case 'top-left':
        left = 20;
        top = 20;
        break;
      case 'top-right':
        left = (metadata.width || 0) - (watermarkMetadata.width || 0) - 20;
        top = 20;
        break;
      case 'bottom-left':
        left = 20;
        top = (metadata.height || 0) - (watermarkMetadata.height || 0) - 20;
        break;
      case 'bottom-right':
        left = (metadata.width || 0) - (watermarkMetadata.width || 0) - 20;
        top = (metadata.height || 0) - (watermarkMetadata.height || 0) - 20;
        break;
      case 'center':
        left = Math.floor(((metadata.width || 0) - (watermarkMetadata.width || 0)) / 2);
        top = Math.floor(((metadata.height || 0) - (watermarkMetadata.height || 0)) / 2);
        break;
    }

    // Apply watermark with opacity
    const watermarkWithOpacity = await sharp(watermark)
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.floor(opacity * 255)]),
          raw: {
            width: 1,
            height: 1,
            channels: 4,
          },
          tile: true,
          blend: 'dest-in',
        },
      ])
      .toBuffer();

    const result = await image
      .composite([
        {
          input: watermarkWithOpacity,
          left,
          top,
        },
      ])
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Watermark error:', error);
    throw error;
  }
}
