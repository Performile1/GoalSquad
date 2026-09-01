import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { supabaseAdmin } from '@/lib/supabase';

const makeQuery = (result: any) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue(result),
  insert: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue(result),
});

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    dbError: vi.fn(),
    apiError: vi.fn(),
  },
}));

describe('POST /api/communities/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retries with alternative valid community types when the first DB enum fails', async () => {
    const communitiesRead = makeQuery({ data: null, error: null });

    const organizationsInsert = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'org-123', name: 'Test School' },
          error: null,
        }),
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'org-123', name: 'Test School' },
        error: null,
      }),
    };

    const communitiesWrite = {
      insert: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23514', message: 'CHECK constraint failed', details: 'community_type' },
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'community-123', name: 'Test School', slug: 'test-school' },
            error: null,
          }),
        }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'community-123', name: 'Test School', slug: 'test-school' },
        error: null,
      }),
    };

    let readMode = true;
    (supabaseAdmin.from as any).mockImplementation((table: string) => {
      switch (table) {
        case 'communities':
          if (readMode) {
            readMode = false;
            return communitiesRead;
          }
          return communitiesWrite;
        case 'organizations':
          return organizationsInsert;
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    });

    const req = new Request('http://localhost/api/communities/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test School',
        slug: 'test-school',
        description: 'Hello',
        communityType: 'school_class',
        city: 'Stockholm',
        country: 'SE',
        contactName: 'Anna',
        contactEmail: 'anna@example.com',
        schoolName: 'Lundaskolan',
        grade: '9B',
        website: '',
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(communitiesWrite.insert).toHaveBeenCalledTimes(2);
    expect((communitiesWrite.insert as any).mock.calls[0][0].community_type).toBe('klass');
    expect((communitiesWrite.insert as any).mock.calls[1][0].community_type).toBe('class');
  });
});
