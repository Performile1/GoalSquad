/**
 * Audit-Log Signature System
 * Creates immutable trust records for critical actions
 * Uses OTP verification (SMS/Email) instead of BankID
 */

import { createHash, randomBytes } from 'crypto';
import { supabaseAdmin } from './supabase';

/** Max incorrect attempts before a pending OTP is invalidated (brute-force guard). */
const MAX_OTP_ATTEMPTS = 3;
/** How long a pending OTP stays valid. */
const OTP_TTL_MS = 5 * 60 * 1000;

export interface SignatureData {
  entityType: 'merchant' | 'order' | 'shipment' | 'payment';
  entityId: string;
  action: string;
  userId?: string;
  email?: string;
  phone?: string;
  verificationMethod: 'otp_sms' | 'otp_email' | 'magic_link';
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: {
    country?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
  metadata?: Record<string, any>;
}

export class AuditSignature {
  /**
   * Generate a random OTP code
   */
  static generateOTP(length = 6): string {
    const digits = '0123456789';
    let otp = '';
    const bytes = randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      otp += digits[bytes[i] % 10];
    }
    
    return otp;
  }

  /**
   * Hash an OTP for secure storage. Peppered with OTP_SECRET (if set) so a
   * leaked DB row alone cannot be reversed/brute-forced offline.
   */
  static hashOTP(otp: string): string {
    return createHash('sha256')
      .update(otp + (process.env.OTP_SECRET ?? ''))
      .digest('hex');
  }

  /**
   * Create a signature hash from all signature data
   */
  static createSignatureHash(data: SignatureData, otpHash: string): string {
    const signatureString = JSON.stringify({
      ...data,
      otpHash,
      timestamp: new Date().toISOString(),
    });
    
    return createHash('sha256').update(signatureString).digest('hex');
  }

  /**
   * Send OTP via SMS (using Twilio)
   */
  static async sendOTPSMS(phone: string, otp: string): Promise<boolean> {
    // TODO: Implement Twilio integration.
    // SECURITY: never log the clear-text OTP — only that a code was dispatched.
    void otp;
    console.log(`[OTP SMS] dispatched to ${phone}`);
    
    // In production:
    // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({
    //   body: `Your GoalSquad verification code is: ${otp}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });
    
    return true;
  }

  /**
   * Send OTP via Email (using Nodemailer)
   */
  static async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    // TODO: Implement email integration.
    // SECURITY: never log the clear-text OTP — only that a code was dispatched.
    void otp;
    console.log(`[OTP Email] dispatched to ${email}`);
    
    // In production:
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   from: 'noreply@goalsquad.shop',
    //   to: email,
    //   subject: 'Your GoalSquad Verification Code',
    //   text: `Your verification code is: ${otp}`,
    //   html: `<p>Your verification code is: <strong>${otp}</strong></p>`
    // });
    
    return true;
  }

  /**
   * Initiate signature process — generate an OTP, store ONLY its hash + TTL
   * server-side, and deliver the clear-text code to the user.
   *
   * SECURITY: the OTP and its hash are NEVER returned to the caller/client.
   */
  static async initiateSignature(
    data: SignatureData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!data.userId) {
        return { success: false, error: 'Missing userId' };
      }

      const otp = this.generateOTP();
      const otpHash = this.hashOTP(otp);
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);

      // Deliver the code (never the hash) to the user.
      if (data.verificationMethod === 'otp_sms' && data.phone) {
        await this.sendOTPSMS(data.phone, otp);
      } else if (data.verificationMethod === 'otp_email' && data.email) {
        await this.sendOTPEmail(data.email, otp);
      } else {
        return { success: false, error: 'Invalid verification method or missing contact info' };
      }

      // One active OTP per (user, action): clear any previous pending code first.
      await supabaseAdmin
        .from('audit_otps')
        .delete()
        .eq('user_id', data.userId)
        .eq('action_type', data.action);

      const { error } = await supabaseAdmin
        .from('audit_otps')
        .insert({
          user_id: data.userId,
          action_type: data.action,
          hashed_otp: otpHash,
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        console.error('Failed to store OTP:', error);
        return { success: false, error: 'Failed to generate verification code' };
      }

      // SECURITY: only a status flag leaves the server.
      return { success: true };
    } catch (error) {
      console.error('Failed to initiate signature:', error);
      return { success: false, error: 'Failed to send verification code' };
    }
  }

  /**
   * Complete signature — verify the user-supplied clear-text OTP against the
   * server-held hash (with TTL + attempt limit), burn it on success, then write
   * the immutable signature record.
   *
   * SECURITY: the caller supplies ONLY the clear-text code — never a hash.
   */
  static async completeSignature(
    data: SignatureData,
    providedOTP: string
  ): Promise<{ success: boolean; signatureId?: string; error?: string }> {
    try {
      if (!data.userId) {
        return { success: false, error: 'Missing userId' };
      }

      // Look up the active pending OTP for this user + action.
      const { data: record, error: lookupError } = await supabaseAdmin
        .from('audit_otps')
        .select('*')
        .eq('user_id', data.userId)
        .eq('action_type', data.action)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lookupError || !record) {
        return { success: false, error: 'No active verification session found' };
      }

      // Expired? Burn and reject.
      if (new Date() > new Date(record.expires_at)) {
        await supabaseAdmin.from('audit_otps').delete().eq('id', record.id);
        return { success: false, error: 'Code has expired' };
      }

      // Brute-force guard.
      if ((record.attempts ?? 0) >= MAX_OTP_ATTEMPTS) {
        await supabaseAdmin.from('audit_otps').delete().eq('id', record.id);
        return { success: false, error: 'Too many incorrect attempts. Code invalidated.' };
      }

      // Verify — the server holds the truth.
      if (this.hashOTP(providedOTP) !== record.hashed_otp) {
        await supabaseAdmin
          .from('audit_otps')
          .update({ attempts: (record.attempts ?? 0) + 1 })
          .eq('id', record.id);
        return { success: false, error: 'Invalid verification code' };
      }

      // Success → burn the code (one-time use) before doing anything else.
      await supabaseAdmin.from('audit_otps').delete().eq('id', record.id);

      // Write the immutable signature record.
      const signatureHash = this.createSignatureHash(data, record.hashed_otp);

      const { data: signature, error } = await supabaseAdmin
        .from('signatures')
        .insert({
          entity_type: data.entityType,
          entity_id: data.entityId,
          action: data.action,
          user_id: data.userId,
          email: data.email,
          phone: data.phone,
          verification_method: data.verificationMethod,
          otp_hash: record.hashed_otp,
          signature_hash: signatureHash,
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          geo_location: data.geoLocation,
          metadata: data.metadata,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create signature:', error);
        return { success: false, error: 'Failed to create signature record' };
      }

      return { success: true, signatureId: signature.id };
    } catch (error) {
      console.error('Failed to complete signature:', error);
      return { success: false, error: 'Failed to complete signature' };
    }
  }

  /**
   * Verify a signature exists and is valid
   */
  static async verifySignature(
    entityType: string,
    entityId: string,
    action: string
  ): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('signatures')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('action', action)
      .single();

    return !error && !!data;
  }

  /**
   * Get all signatures for an entity
   */
  static async getEntitySignatures(
    entityType: string,
    entityId: string
  ) {
    const { data, error } = await supabaseAdmin
      .from('signatures')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('signed_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch signatures:', error);
      return [];
    }

    return data || [];
  }
}
