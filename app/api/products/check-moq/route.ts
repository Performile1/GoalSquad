/**
 * Check MOQ Status API
 * POST /api/products/check-moq
 * 
 * Check if product MOQ is reached for given postal code
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkMOQStatus } from '@/lib/moq-handler';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { productId, postalCode } = await req.json();

    if (!productId || !postalCode) {
      return NextResponse.json(
        { error: 'Product ID and postal code required' },
        { status: 400 }
      );
    }

    const moqStatus = await checkMOQStatus(productId, postalCode);

    return NextResponse.json(moqStatus);
  } catch (error) {
    logger.apiError('POST', '/api/products/check-moq', error as Error, { productId, postalCode });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
