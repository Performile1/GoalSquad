/**
 * Audit-Log Signature System
 * Creates immutable trust records for critical actions
 * Uses OTP verification (SMS/Email) instead of BankID
 */

import { createHash, randomBytes } from 'crypto';
import { supabaseAdmin } from './supabase';

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
   * Hash an OTP for secure storage
   */
  static hashOTP(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
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
    // TODO: Implement Twilio integration
    // For now, just log it (in production, send via Twilio)
    console.log(`[OTP SMS] Sending to ${phone}: ${otp}`);
    
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
    // TODO: Implement email integration
    // For now, just log it (in production, send via Nodemailer/SendGrid)
    console.log(`[OTP Email] Sending to ${email}: ${otp}`);
    
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
   * Initiate signature process - send OTP
   */
  static async initiateSignature(
    data: SignatureData
  ): Promise<{ success: boolean; otp?: string; error?: string }> {
    try {
      const otp = this.generateOTP();
      const otpHash = this.hashOTP(otp);

      // Send OTP based on verification method
      if (data.verificationMethod === 'otp_sms' && data.phone) {
        await this.sendOTPSMS(data.phone, otp);
      } else if (data.verificationMethod === 'otp_email' && data.email) {
        await this.sendOTPEmail(data.email, otp);
      } else {
        return { success: false, error: 'Invalid verification method or missing contact info' };
      }

      // Store OTP hash temporarily (you might want a separate table for pending signatures)
      // For now, we'll return it for verification
      return { success: true, otp: otpHash };
    } catch (error) {
      console.error('Failed to initiate signature:', error);
      return { success: false, error: 'Failed to send verification code' };
    }
  }

  /**
   * Complete signature - verify OTP and create immutable record
   */
  static async completeSignature(
    data: SignatureData,
    providedOTP: string,
    storedOTPHash: string
  ): Promise<{ success: boolean; signatureId?: string; error?: string }> {
    try {
      // Verify OTP
      const providedOTPHash = this.hashOTP(providedOTP);
      if (providedOTPHash !== storedOTPHash) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Create signature hash
      const signatureHash = this.createSignatureHash(data, storedOTPHash);

      // Insert immutable signature record
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
          otp_hash: storedOTPHash,
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
