/**
 * Featured Communities API
 * GET /api/communities/featured
 * 
 * Get communities to display in homepage banner
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    // Get featured communities
    const { data: communities, error } = await supabaseAdmin
      .from('communities')
      .select('*')
      .not('logo_url', 'is', null)
      .limit(50);

    if (error) {
      logger.dbError('SELECT', 'communities', error);
      return NextResponse.json(
        { error: 'Failed to fetch communities' },
        { status: 500 }
      );
    }

    const formattedCommunities = (communities || []).map((community: any) => ({
      id: community.id,
      name: community.name,
      logoUrl: community.logo_url,
      logoBannerUrl: community.logo_banner_url,
      city: community.city,
      country: community.country,
      totalMembers: community.total_members || 0,
      totalSales: parseFloat(community.total_sales || 0),
      communityType: community.community_type,
      brandColors: community.brand_colors,
    }));

    return NextResponse.json({ communities: formattedCommunities });
  } catch (error) {
    logger.apiError('GET', '/api/communities/featured', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
