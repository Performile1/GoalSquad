import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Alla fält är obligatoriska' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Misslyckades att skapa användare' },
        { status: 400 }
      );
    }

    // Update profile with role
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role,
          full_name: fullName,
          is_active: true,
          is_verified: true,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        return NextResponse.json(
          { error: 'Användare skapad men kunde inte uppdatera profil' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: 'Användare skapad' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internt serverfel' },
      { status: 500 }
    );
  }
}
