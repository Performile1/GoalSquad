/**
 * Contact Information API
 * GET/PUT /api/contact/[entityType]/[entityId]
 * 
 * Manage contact information for merchants, communities, sellers, users
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getAuthUser, getUserRole } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(
  req: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  let entityType = params.entityType;
  let entityId = params.entityId;
  try {
    const limit = rateLimit(req, 'contact-update', 20);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });
    // Validate entity type
    const validTypes = ['merchant', 'community', 'seller', 'user'];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    // Get contact information
    const { data: contact, error } = await supabaseAdmin
      .from('contact_information')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_primary', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.dbError('SELECT', 'contact_information', error, { entityType, entityId });
      return NextResponse.json(
        { error: 'Failed to fetch contact information' },
        { status: 500 }
      );
    }

    return NextResponse.json({ contact: contact || null });
  } catch (error) {
    logger.apiError('GET', '/api/contact/[entityType]/[entityId]', error as Error, { entityType, entityId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  let entityType = params.entityType;
  let entityId = params.entityId;
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Validate entity type
    const validTypes = ['merchant', 'community', 'seller', 'user'];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    const role = await getUserRole(user.id);
    const isAdmin = ['gs_admin', 'admin'].includes(role || '');
    let ownsEntity = entityType === 'user' && entityId === user.id;
    if (entityType === 'merchant') {
      const { data } = await supabaseAdmin.from('merchants').select('user_id').eq('id', entityId).maybeSingle();
      ownsEntity = data?.user_id === user.id;
    } else if (entityType === 'seller') {
      const { data } = await supabaseAdmin.from('seller_profiles').select('user_id').eq('id', entityId).maybeSingle();
      ownsEntity = data?.user_id === user.id;
    } else if (entityType === 'community') {
      const { data } = await supabaseAdmin.from('communities').select('owner_id').eq('id', entityId).maybeSingle();
      ownsEntity = data?.owner_id === user.id;
    }
    if (!ownsEntity && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Check if contact exists
    const { data: existing } = await supabaseAdmin
      .from('contact_information')
      .select('id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_primary', true)
      .single();

    const contactData = {
      entity_type: entityType,
      entity_id: entityId,
      email: body.email || null,
      phone: body.phone || null,
      mobile: body.mobile || null,
      website: body.website || null,
      address_line1: body.addressLine1 || null,
      address_line2: body.addressLine2 || null,
      postal_code: body.postalCode || null,
      city: body.city || null,
      region: body.region || null,
      country: body.country || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      facebook_url: body.facebookUrl || null,
      instagram_url: body.instagramUrl || null,
      twitter_url: body.twitterUrl || null,
      linkedin_url: body.linkedinUrl || null,
      business_hours: body.businessHours || null,
      contact_person: body.contactPerson || null,
      contact_role: body.contactRole || null,
      is_public: body.isPublic || false,
      is_primary: true,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('contact_information')
        .update(contactData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('contact_information')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ contact: result });
  } catch (error) {
    logger.apiError('PUT', '/api/contact/[entityType]/[entityId]', error as Error, { entityType, entityId });
    return NextResponse.json(
      { error: 'Failed to update contact information' },
      { status: 500 }
    );
  }
}
