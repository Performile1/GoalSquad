/**
 * Unit tests for Split Engine
 * Tests financial calculations and RPC result parsing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SplitEngine } from './split-engine';

// Mock supabase
vi.mock('./supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            or: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn(),
              })),
            })),
          })),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

describe('SplitEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSplitConfig', () => {
    it('should return default configuration when no config exists', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      (supabaseAdmin.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            or: vi.fn(() => ({
              or: vi.fn(() => ({
                limit: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
                })),
              })),
            })),
          })),
        })),
      });

      const config = await SplitEngine.getSplitConfig();
      
      expect(config).toEqual({
        platformPercent: 12.0,
        communityPercent: 60.0,
        sellerPercent: 20.0,
        warehousePercent: 8.0,
        handlingFee: 25.0,
        shippingSpreadPercent: 20.0,
      });
    });

    it('should return custom configuration from database', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      const mockConfig = {
        platform_percent: 15.0,
        community_percent: 55.0,
        seller_percent: 25.0,
        warehouse_percent: 5.0,
        handling_fee: 30.0,
        shipping_spread_percent: 15.0,
      };

      (supabaseAdmin.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            or: vi.fn(() => ({
              or: vi.fn(() => ({
                limit: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
                })),
              })),
            })),
          })),
        })),
      });

      const config = await SplitEngine.getSplitConfig();
      
      expect(config).toEqual({
        platformPercent: 15.0,
        communityPercent: 55.0,
        sellerPercent: 25.0,
        warehousePercent: 5.0,
        handlingFee: 30.0,
        shippingSpreadPercent: 15.0,
      });
    });
  });

  describe('processOrderSplit', () => {
    it('should parse RPC result correctly with string numbers', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      const mockResult = {
        status: 'success',
        transaction_id: 'txn_123',
        total: '1000.00',
        splits: {
          platform: '120.00',
          handling: '25.00',
          community: '600.00',
          seller: '200.00',
          warehouse: '80.00',
        },
      };

      (supabaseAdmin.rpc as any).mockResolvedValue({ data: mockResult, error: null });

      const result = await SplitEngine.processOrderSplit('order_123');
      
      expect(result).toEqual({
        transactionId: 'txn_123',
        totalAmount: 1000.00,
        splits: {
          platformShare: 120.00,
          communityShare: 600.00,
          sellerShare: 200.00,
          warehouseShare: 80.00,
          handlingFee: 25.00,
          platformRevenue: 145.00,
        },
        ledgerEntries: [],
      });
    });

    it('should parse RPC result correctly with number values', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      const mockResult = {
        status: 'success',
        transaction_id: 'txn_456',
        total: 500.50,
        splits: {
          platform: 60.06,
          handling: 25.00,
          community: 300.30,
          seller: 100.10,
          warehouse: 40.04,
        },
      };

      (supabaseAdmin.rpc as any).mockResolvedValue({ data: mockResult, error: null });

      const result = await SplitEngine.processOrderSplit('order_456');
      
      expect(result).toEqual({
        transactionId: 'txn_456',
        totalAmount: 500.50,
        splits: {
          platformShare: 60.06,
          communityShare: 300.30,
          sellerShare: 100.10,
          warehouseShare: 40.04,
          handlingFee: 25.00,
          platformRevenue: 85.06,
        },
        ledgerEntries: [],
      });
    });

    it('should handle missing splits gracefully', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      const mockResult = {
        status: 'success',
        transaction_id: 'txn_789',
        total: 1000,
        splits: {},
      };

      (supabaseAdmin.rpc as any).mockResolvedValue({ data: mockResult, error: null });

      const result = await SplitEngine.processOrderSplit('order_789');
      
      expect(result).toEqual({
        transactionId: 'txn_789',
        totalAmount: 1000,
        splits: {
          platformShare: 0,
          communityShare: 0,
          sellerShare: 0,
          warehouseShare: 0,
          handlingFee: 0,
          platformRevenue: 0,
        },
        ledgerEntries: [],
      });
    });

    it('should throw error when RPC fails', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      (supabaseAdmin.rpc as any).mockResolvedValue({ 
        data: null, 
        error: { message: 'Order not found' } 
      });

      await expect(SplitEngine.processOrderSplit('order_invalid'))
        .rejects
        .toThrow('Split failed for order order_invalid: Order not found');
    });

    it('should handle extreme edge case: very small order (1 SEK)', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      const mockResult = {
        status: 'success',
        transaction_id: 'txn_small',
        total: '1.00',
        splits: {
          platform: '0.12',
          handling: '25.00',
          community: '0.60',
          seller: '0.20',
          warehouse: '0.08',
        },
      };

      (supabaseAdmin.rpc as any).mockResolvedValue({ data: mockResult, error: null });

      const result = await SplitEngine.processOrderSplit('order_small');
      
      expect(result.totalAmount).toBe(1.00);
      expect(result.splits.platformShare).toBe(0.12);
    });

    it('should handle extreme edge case: very large order (1,000,000 SEK)', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      const mockResult = {
        status: 'success',
        transaction_id: 'txn_large',
        total: '1000000.00',
        splits: {
          platform: '120000.00',
          handling: '25.00',
          community: '600000.00',
          seller: '200000.00',
          warehouse: '80000.00',
        },
      };

      (supabaseAdmin.rpc as any).mockResolvedValue({ data: mockResult, error: null });

      const result = await SplitEngine.processOrderSplit('order_large');
      
      expect(result.totalAmount).toBe(1000000.00);
      expect(result.splits.communityShare).toBe(600000.00);
    });
  });

  describe('getWalletBalance', () => {
    it('should return zero balance when wallet not found', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      (supabaseAdmin.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            })),
          })),
        })),
      });

      const balance = await SplitEngine.getWalletBalance('merchant', 'merchant_123');
      
      expect(balance).toEqual({ balance: 0, currency: 'SEK' });
    });

    it('should return wallet balance when found', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      const mockWallet = {
        balance: '5000.50',
        currency: 'SEK',
      };

      (supabaseAdmin.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockWallet, error: null }),
            })),
          })),
        })),
      });

      const balance = await SplitEngine.getWalletBalance('merchant', 'merchant_123');
      
      expect(balance).toEqual({ balance: 5000.50, currency: 'SEK' });
    });
  });

  describe('getTransactionHistory', () => {
    it('should return empty array when wallet not found', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      (supabaseAdmin.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            })),
          })),
        })),
      });

      const history = await SplitEngine.getTransactionHistory('merchant', 'merchant_123');
      
      expect(history).toEqual([]);
    });

    it('should return transaction history when wallet found', async () => {
      const { supabaseAdmin } = await import('./supabase');
      
      const mockWallet = { id: 'wallet_123' };
      const mockLedger = [
        { id: 'entry_1', amount: 100, type: 'credit' },
        { id: 'entry_2', amount: 50, type: 'debit' },
      ];

      (supabaseAdmin.from as any)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: mockWallet, error: null }),
              })),
            })),
          })),
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({ data: mockLedger, error: null }),
              })),
            })),
          })),
        });

      const history = await SplitEngine.getTransactionHistory('merchant', 'merchant_123');
      
      expect(history).toEqual(mockLedger);
    });
  });
});
