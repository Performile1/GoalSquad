/**
 * Community Logo Upload API
 * POST /api/communities/[id]/logo
 * 
 * Upload logo for community (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;
    const userId = req.headers.get('x-user-id'); // TODO: Get from session

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is community admin
    const { data: member } = await supabaseAdmin
      .from('seller_profiles')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single();

    if (!member || !['community_admin', 'community_owner'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Only community admins can upload logos' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const logoFile = formData.get('logo') as File;
    const logoType = formData.get('type') as string; // 'primary', 'banner', 'icon'

    if (!logoFile) {
      return NextResponse.json({ error: 'Logo file required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(logoFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use PNG, JPEG, SVG, or WebP' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (logoFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 5MB' },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${communityId}-${logoType || 'primary'}-${Date.now()}.${fileExt}`;
    const filePath = `community-logos/${fileName}`;

    const arrayBuffer = await logoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('public')
      .upload(filePath, buffer, {
        contentType: logoFile.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('public')
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    // Update community with logo URL
    const columnMap: Record<string, string> = {
      primary: 'logo_url',
      banner: 'logo_banner_url',
      icon: 'logo_icon_url',
    };

    const column = columnMap[logoType] || 'logo_url';

    const { error: updateError } = await supabaseAdmin
      .from('communities')
      .update({ [column]: logoUrl })
      .eq('id', communityId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update community' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logoUrl,
      type: logoType,
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update community branding
 * PUT /api/communities/[id]/logo
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const communityId = params.id;
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const { data: member } = await supabaseAdmin
      .from('seller_profiles')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single();

    if (!member || !['community_admin', 'community_owner'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { brandColors } = await req.json();

    const updates: any = {};
    if (brandColors) updates.brand_colors = brandColors;

    const { error } = await supabaseAdmin
      .from('communities')
      .update(updates)
      .eq('id', communityId);

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update branding' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Branding update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
