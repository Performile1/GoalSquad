/**
 * Validate EAN API
 * GET /api/products/validate-ean?ean=5901234123457
 * 
 * Validate EAN-13 checksum
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const ean = searchParams.get('ean');

    if (!ean) {
      return NextResponse.json(
        { error: 'EAN required' },
        { status: 400 }
      );
    }

    // Use database function for validation
    const { data, error } = await supabaseAdmin.rpc('validate_ean13', {
      ean_code: ean,
    });

    if (error) {
      console.error('EAN validation error:', error);
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: data });
  } catch (error) {
    console.error('Validate EAN error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
