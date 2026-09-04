import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = rateLimit(request, 'warehouse-register', 5);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many registration attempts' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });

  const body = await request.json();
  if (!body.companyName || !body.orgNumber || !body.contactName || !body.contactEmail || !body.packagesPerDay) {
    return NextResponse.json({ error: 'Company, organization number, contact and capacity are required' }, { status: 400 });
  }

  const partnerCode = `WP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const { data, error } = await supabaseAdmin
    .from('warehouse_partners')
    .insert({
      user_id: user.id,
      partner_name: body.companyName,
      partner_code: partnerCode,
      territory: body.country || 'SE',
      contact_email: body.contactEmail,
      contact_phone: body.contactPhone || null,
      status: 'pending',
      metadata: {
        organization_number: body.orgNumber,
        contact_name: body.contactName,
        city: body.city || null,
        capacity: body.capacity || null,
        packages_per_day: body.packagesPerDay,
        services: body.services || [],
        storage_cost_per_unit: body.storageCostPerUnit || null,
        handling_cost_per_unit: body.handlingCostPerUnit || null,
        shipping_cost_type: body.shippingCostType || 'goalsquad',
        shipping_cost_per_unit: body.shippingCostPerUnit || null,
      },
    })
    .select('id, partner_name, partner_code, status')
    .single();

  if (error) return NextResponse.json({ error: 'Could not register warehouse partner' }, { status: 500 });
  return NextResponse.json({ warehouse: data }, { status: 201 });
}