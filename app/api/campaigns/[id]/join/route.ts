import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Shim: no campaign_sellers table exists yet
    // In production this would insert into campaign_sellers or similar
    logger.info(`User ${user.id} requested to join campaign ${params.id}`);

    return NextResponse.json({ success: true, message: 'Anmälan mottagen' });
  } catch (error) {
    logger.apiError('POST', `/api/campaigns/${params.id}/join`, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
