import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

const ALLOWED_ROLES = ['user', 'seller', 'merchant', 'community', 'warehouse', 'gs_admin'];

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const body = await request.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Alla fält är obligatoriska' },
        { status: 400 }
      );
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Ogiltig roll' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      logger.apiError('POST', '/api/admin/users/create', authError, { email });
      return NextResponse.json(
        { error: authError.message || 'Misslyckades att skapa användare' },
        { status: 400 }
      );
    }

    // Update profile with role
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          role,
          full_name: fullName,
          is_active: true,
          is_verified: true,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        logger.dbError('UPDATE', 'profiles', profileError, { email });
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
    logger.apiError('POST', '/api/admin/users/create', error as Error, { email });
    return NextResponse.json(
      { error: 'Internt serverfel' },
      { status: 500 }
    );
  }
}
