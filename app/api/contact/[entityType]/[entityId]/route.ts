/**
 * Contact Information API
 * GET/PUT /api/contact/[entityType]/[entityId]
 * 
 * Manage contact information for merchants, communities, sellers, users
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  req: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { entityType, entityId } = params;

    // Validate entity type
    const validTypes = ['merchant', 'community', 'seller', 'user'];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    // Get contact information
    const { data: contact, error } = await supabase
      .from('contact_information')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_primary', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch contact:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contact information' },
        { status: 500 }
      );
    }

    return NextResponse.json({ contact: contact || null });
  } catch (error) {
    console.error('Contact API error:', error);
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
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { entityType, entityId } = params;
    const body = await req.json();

    // Validate entity type
    const validTypes = ['merchant', 'community', 'seller', 'user'];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    // TODO: Add permission check based on entity type
    // For now, assuming authenticated user has permission

    // Check if contact exists
    const { data: existing } = await supabase
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
      const { data, error } = await supabase
        .from('contact_information')
        .update(contactData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('contact_information')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ contact: result });
  } catch (error) {
    console.error('Update contact error:', error);
    return NextResponse.json(
      { error: 'Failed to update contact information' },
      { status: 500 }
    );
  }
}
