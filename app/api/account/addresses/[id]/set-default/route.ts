import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { idParamSchema, validateParams } from '@/lib/validation';

const getUserId = async () => {
  const supabase = createClient(cookies());
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
};

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paramCheck = validateParams(params, idParamSchema);
    if ('error' in paramCheck) {
      return paramCheck.error;
    }

    const supabase = createClient(cookies());

    await supabase
      .from('address_book')
      .update({ is_default: false })
      .eq('user_id', userId)
      .neq('id', paramCheck.data.id);

    const { error } = await supabase
      .from('address_book')
      .update({ is_default: true })
      .eq('id', paramCheck.data.id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to set default address' }, { status: 500 });
  }
}
