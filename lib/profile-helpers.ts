/**
 * Profile Helpers - Centralized profile lookup functions
 * 
 * Reduces code duplication across 30+ API routes by providing
 * a single source of truth for profile fetching logic.
 */

import { supabaseAdmin } from './supabase';

export interface Profile {
  id: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  email: string;
  full_name?: string;
  avatar_url?: string;
  stripe_customer_id?: string;
  entity_type?: string;
  [key: string]: any;
}

/**
 * Fetch a user profile by ID with specified fields
 * 
 * @param userId - The user ID to fetch profile for
 * @param fields - Comma-separated list of fields to select (default: 'role, is_active')
 * @returns Profile object or null if not found/error
 */
export async function getProfile(userId: string, fields = 'role, is_active'): Promise<Profile | null> {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select(fields)
      .eq('id', userId)
      .single();

    if (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      return null;
    }

    return profile as Profile;
  } catch (error) {
    console.error(`Unexpected error fetching profile for user ${userId}:`, error);
    return null;
  }
}

/**
 * Fetch a user profile with Stripe customer ID
 * Useful for payment-related operations
 */
export async function getProfileWithStripeId(userId: string): Promise<Profile | null> {
  return getProfile(userId, 'stripe_customer_id');
}

/**
 * Fetch a user profile with entity type
 * Useful for role-based routing
 */
export async function getProfileWithEntityType(userId: string): Promise<Profile | null> {
  return getProfile(userId, 'role, entity_type, is_active');
}

/**
 * Check if a user has a specific role
 * 
 * @param userId - The user ID to check
 * @param allowedRoles - Array of allowed roles
 * @returns true if user has one of the allowed roles
 */
export async function hasRole(userId: string, allowedRoles: string[]): Promise<boolean> {
  const profile = await getProfile(userId, 'role');
  if (!profile) return false;
  return allowedRoles.includes(profile.role);
}

/**
 * Check if a user is active
 * 
 * @param userId - The user ID to check
 * @returns true if user is active
 */
export async function isUserActive(userId: string): Promise<boolean> {
  const profile = await getProfile(userId, 'is_active');
  if (!profile) return false;
  return profile.is_active === true;
}
