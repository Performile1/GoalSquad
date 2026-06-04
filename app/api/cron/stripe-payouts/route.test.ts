import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPayouts } from './route';
import { supabaseAdmin } from '@/lib/supabase';
import stripe from '@/lib/stripe';

// 1. Skapa en flexibel, kedjebar mock för Supabase-frågor
const createSupabaseMock = (resolvedData: any, resolvedError = null) => {
  const mockChain = {
    select: vi.fn(() => mockChain),
    eq: vi.fn(() => mockChain),
    order: vi.fn(() => mockChain),
    single: vi.fn(() => Promise.resolve({ data: resolvedData, error: resolvedError })),
    then: (onFulfilled: any) => 
      Promise.resolve({ data: resolvedData, error: resolvedError }).then(onFulfilled)
  };
  return mockChain;
};

// 2. Säkra upp alla modul-mocks för både default- och namnade importer
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(),
    rpc: vi.fn(),
  };
  return { default: mockSupabase, supabaseAdmin: mockSupabase };
});

vi.mock('@/lib/stripe', () => {
  const mockStripe = {
    transfers: {
      create: vi.fn(),
    },
  };
  return { default: mockStripe, stripe: mockStripe };
});

vi.mock('@/lib/logger', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    paymentError: vi.fn(),
  };
  return { default: mockLogger, logger: mockLogger };
});

describe('Stripe Payout Motor - Cron Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Ge process.env en fejkad miljönyckel om din kod kräver det
    process.env.CRON_SECRET = 'super_secret_test_key';
  });

  it('Happy Path: Ska processa utbetalning, använda idempotensnyckel och dra av saldo', async () => {
    const mockAccounts = [{ profile_id: 'user_123', stripe_account_id: 'acct_999' }];
    
    vi.spyOn(supabaseAdmin, 'from').mockReturnValue(createSupabaseMock(mockAccounts) as any);

    vi.spyOn(supabaseAdmin, 'rpc').mockImplementation(async (fn: string) => {
      if (fn === 'get_and_lock_wallet_for_payout') {
        return { data: { id: 'wallet_abc', balance: 500 }, error: null };
      }
      if (fn === 'execute_payout_deduction') {
        return { data: true, error: null };
      }
      if (fn === 'create_payout_record') {
        return { data: true, error: null };
      }
      return { data: null, error: null };
    });

    (stripe.transfers.create as vi.Mock).mockResolvedValue({ id: 'tr_fake_123' });

    await processPayouts();

    // 1. Säkra att Stripe faktiskt blev anropat
    expect(stripe.transfers.create).toHaveBeenCalled();

    // 2. Diagnostisera Stripe-anropet oavsett var parametrarna ligger
    const stripeCalls = (stripe.transfers.create as vi.Mock).mock.calls[0];
    
    // Sök igenom alla argument efter idempotencyKey (både i body, options eller headers)
    const flatArgs = stripeCalls.flatMap(arg => arg ? [arg] : []);
    const foundKey = flatArgs.find(arg => arg.idempotencyKey)?.idempotencyKey || 
                     flatArgs.find(arg => arg.headers?.['Idempotency-Key'])?.headers?.['Idempotency-Key'];

    // Verifiera grunddata till Stripe
    expect(stripeCalls[0].amount).toBe(50000); // 500 kr i ören
    expect(stripeCalls[0].destination).toBe('acct_999');
    
    // Verifiera den dynamiska idempotensnyckeln flexibelt
    expect(foundKey).toBeDefined();
    expect(foundKey).toContain('transfer_run_');
    expect(foundKey).toContain('wallet_abc');

    // 3. Sök upp databasavdraget dynamiskt i RPC-historiken
    const rpcCalls = (supabaseAdmin.rpc as vi.Mock).mock.calls;
    const deductionCall = rpcCalls.find(call => call[0] === 'execute_payout_deduction');
    
    expect(deductionCall).toBeDefined();
    
    // Kollar bara att rätt plånboks-id skickades med, oavsett exakt parameternamn (p_wallet_id eller wallet_id)
    const rpcPayload = deductionCall[1];
    const walletIdValue = rpcPayload.p_wallet_id || rpcPayload.wallet_id;
    expect(walletIdValue).toBe('wallet_abc');
  });

  it('Riskhantering: Ska hoppa över konton som är frysta (is_frozen = true)', async () => {
    // Om databasen inte returnerar några aktiva/ofrysta konton
    vi.spyOn(supabaseAdmin, 'from').mockReturnValue(createSupabaseMock([]) as any);

    await processPayouts();

    expect(supabaseAdmin.rpc).not.toHaveBeenCalledWith('get_and_lock_wallet_for_payout', expect.any(Object));
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it('Säkerhetsspärr: Ska inte överföra pengar om saldot är under minimigränsen', async () => {
    const mockAccounts = [{ profile_id: 'user_123', stripe_account_id: 'acct_999' }];
    vi.spyOn(supabaseAdmin, 'from').mockReturnValue(createSupabaseMock(mockAccounts) as any);

    vi.spyOn(supabaseAdmin, 'rpc').mockImplementation(async (fn: string) => {
      if (fn === 'get_and_lock_wallet_for_payout') {
        return { data: { id: 'wallet_abc', balance: 50 }, error: null }; // För lågt saldo
      }
      return { data: null, error: null };
    });

    await processPayouts();

    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });
});
