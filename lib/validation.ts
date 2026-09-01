/**
 * Central Zod validation utilities for API routes.
 * Provides consistent param / body / query validation with 400 responses.
 */

import { z, ZodSchema } from 'zod';
import { NextResponse } from 'next/server';

/** Validates that a string is a valid UUID. */
export const uuidSchema = z.string().uuid('Ogiltigt ID-format');

/** Validates a positive integer for pagination. */
export const positiveIntSchema = z.number().int().min(1).max(1000);

/**
 * Validates URL path parameters against a Zod schema.
 * Returns the parsed data or a ready-to-return 400 NextResponse.
 */
export function validateParams<T extends ZodSchema>(
  rawParams: Record<string, string | undefined>,
  schema: T
): { data: z.infer<T> } | { error: NextResponse } {
  const result = schema.safeParse(rawParams);
  if (!result.success) {
    return {
      error: NextResponse.json(
        { error: 'Valideringsfel', details: result.error.format() },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}

/**
 * Validates a JSON request body against a Zod schema.
 * Returns the parsed data or a ready-to-return 400 NextResponse.
 */
export async function validateBody<T extends ZodSchema>(
  req: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return {
        error: NextResponse.json(
          { error: 'Valideringsfel', details: result.error.format() },
          { status: 400 }
        ),
      };
    }
    return { data: result.data };
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Ogiltig JSON-body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validates query string parameters against a Zod schema.
 */
export function validateQuery<T extends ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): { data: z.infer<T> } | { error: NextResponse } {
  const raw: Record<string, string | undefined> = {};
  searchParams.forEach((value, key) => {
    if (raw[key] === undefined) raw[key] = value;
  });

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      error: NextResponse.json(
        { error: 'Valideringsfel', details: result.error.format() },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}

/** Convenience: single UUID param schema for dynamic routes. */
export const idParamSchema = z.object({ id: uuidSchema });

const sanitizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const booleanStringSchema = z.union([
  z.boolean(),
  z.literal('true').transform(() => true),
  z.literal('false').transform(() => false),
]);

export const addressSchema = z.object({
  label: z.string().transform(sanitizeText).pipe(
    z.string().min(1).max(60).regex(/^[\p{L}\p{N}\s'.#&/\-]+$/u, 'Invalid label')
  ),
  full_name: z.string().transform(sanitizeText).pipe(
    z.string().min(1).max(120).regex(/^[\p{L}\p{N}\s.'’\-]+$/u, 'Invalid full name')
  ),
  address_line1: z.string().transform(sanitizeText).pipe(
    z.string().min(1).max(160).regex(/^[\p{L}\p{N}\s.,#/-]+$/u, 'Invalid address line 1')
  ),
  address_line2: z.string().optional().nullable().transform((value) => value ? sanitizeText(value) : null).pipe(
    z.string().max(160).regex(/^[\p{L}\p{N}\s.,#/-]*$/u, 'Invalid address line 2').nullable().optional()
  ),
  city: z.string().transform(sanitizeText).pipe(
    z.string().min(1).max(80).regex(/^[\p{L}\p{N}\s.'’\-]+$/u, 'Invalid city')
  ),
  postal_code: z.string().transform(sanitizeText).pipe(
    z.string().min(2).max(16).regex(/^[A-Za-z0-9\s-]{2,16}$/, 'Invalid postal code')
  ),
  country: z.string().transform((value) => value.trim().toUpperCase()).pipe(
    z.string().min(2).max(2).regex(/^[A-Z]{2}$/, 'Invalid country code')
  ),
  phone: z.string().transform(sanitizeText).pipe(
    z.string().min(6).max(20).regex(/^\+?[0-9\s()-]{6,20}$/, 'Invalid phone number')
  ),
  is_default: booleanStringSchema.default(false),
});

export const addressUpdateSchema = addressSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field must be provided' }
);
