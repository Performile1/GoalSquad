import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Update admin user role to gs_admin
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        role: 'gs_admin',
        is_verified: true,
        is_active: true
      })
      .eq('email', 'admin@goalsquad.se')
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Admin role updated successfully',
      user: data 
    });
  } catch (error) {
    console.error('Error updating admin role:', error);
    return NextResponse.json(
      { error: 'Failed to update admin role' },
      { status: 500 }
    );
  }
}
