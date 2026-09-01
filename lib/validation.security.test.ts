import { describe, expect, it } from 'vitest';
import { addressSchema } from '@/lib/validation';

describe('addressSchema security validation', () => {
  it('rejects script injection and malformed payloads', () => {
    const result = addressSchema.safeParse({
      label: '<script>alert(1)</script>',
      full_name: 'A',
      address_line1: 'x',
      address_line2: 'x',
      city: 'Stockholm',
      postal_code: 'SE',
      country: 'SE',
      phone: '123',
      is_default: 'true',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a sanitized valid payload', () => {
    const result = addressSchema.safeParse({
      label: ' Home ',
      full_name: 'Anna Andersson',
      address_line1: 'Storgatan 12',
      address_line2: 'Lägenhet 4',
      city: 'Stockholm',
      postal_code: '111 22',
      country: 'SE',
      phone: '+46701234567',
      is_default: true,
    });

    expect(result.success).toBe(true);
  });
});
