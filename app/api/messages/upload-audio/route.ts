/**
 * Voice Message Upload API
 * POST /api/messages/upload-audio
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authUser.id;

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const duration = formData.get('duration') as string;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
    }

    // Validate file size (max 5MB for audio)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (audioFile.size > maxSize) {
      return NextResponse.json({ error: 'Audio file too large (max 5MB)' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json({ error: 'Invalid audio format' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const fileExt = audioFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('voice-messages')
      .upload(fileName, audioFile);

    if (uploadError) {
      logger.dbError('UPLOAD', 'voice-messages', uploadError, { userId, fileName });
      return NextResponse.json(
        { error: 'Failed to upload audio' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('voice-messages')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      duration: duration ? parseInt(duration) : 0,
    });
  } catch (error) {
    logger.apiError('POST', '/api/messages/upload-audio', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
