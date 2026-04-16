/**
 * Nearby Communities API
 * GET /api/communities/nearby?lat=59.9139&lng=10.7522&radius=50
 * 
 * Find communities near a location using Haversine formula
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '50'); // km

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude required' },
        { status: 400 }
      );
    }

    // Get all communities (in production, add geospatial index)
    const { data: communities, error } = await supabaseAdmin
      .from('communities')
      .select('*');

    if (error) {
      console.error('Failed to fetch communities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch communities' },
        { status: 500 }
      );
    }

    // Calculate distance and filter
    const nearbyCommunities = (communities || [])
      .map((community: any) => {
        // Get coordinates from metadata or geocode city
        const communityLat = community.metadata?.latitude || 0;
        const communityLng = community.metadata?.longitude || 0;

        if (!communityLat || !communityLng) {
          // Skip communities without coordinates
          return null;
        }

        const distance = calculateDistance(
          lat,
          lng,
          communityLat,
          communityLng
        );

        return {
          ...community,
          distance,
          latitude: communityLat,
          longitude: communityLng,
        };
      })
      .filter((c: any) => c && c.distance <= radius)
      .sort((a: any, b: any) => a.distance - b.distance);

    return NextResponse.json({ communities: nearbyCommunities });
  } catch (error) {
    console.error('Nearby communities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
