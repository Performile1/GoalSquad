/**
 * Avatar API
 * GET /api/sellers/[id]/avatar - Get avatar data
 * PUT /api/sellers/[id]/avatar - Update avatar
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = params.id;

    // Get seller profile
    const { data: sellerProfile, error } = await supabaseAdmin
      .from('seller_profiles')
      .select('avatar_data')
      .eq('user_id', sellerId)
      .single();

    if (error || !sellerProfile) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Get all avatar items
    const { data: allItems } = await supabaseAdmin
      .from('avatar_items')
      .select('*')
      .order('rarity', { ascending: false });

    const avatarData = sellerProfile.avatar_data || {
      base: 'default',
      gear: [],
      background: 'bg_blue',
      unlockedItems: [],
    };

    // Mark items as locked/unlocked
    const availableItems = allItems?.map((item: any) => ({
      itemId: item.item_id,
      name: item.name,
      description: item.description,
      itemType: item.item_type,
      rarity: item.rarity,
      imageUrl: item.image_url,
      isLocked: !avatarData.unlockedItems.includes(item.item_id) && item.unlock_type !== 'default',
      unlockRequirement: getUnlockRequirement(item),
    })) || [];

    return NextResponse.json({
      avatarData,
      availableItems,
    });
  } catch (error) {
    console.error('Failed to fetch avatar data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = params.id;
    const body = await req.json();
    const { avatarData } = body;

    // Update avatar data
    const { error } = await supabaseAdmin
      .from('seller_profiles')
      .update({ avatar_data: avatarData })
      .eq('user_id', sellerId);

    if (error) {
      console.error('Failed to update avatar:', error);
      return NextResponse.json(
        { error: 'Failed to update avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Avatar update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getUnlockRequirement(item: any): string {
  switch (item.unlock_type) {
    case 'achievement':
      return 'Complete achievement';
    case 'level':
      return `Reach level ${item.unlock_requirement}`;
    case 'purchase':
      return 'Available for purchase';
    case 'seasonal':
      return `Available during ${item.season_name}`;
    default:
      return 'Unlocked by default';
  }
}
