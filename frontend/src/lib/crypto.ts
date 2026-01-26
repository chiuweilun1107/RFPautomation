/**
 * Token Encryption Utility
 * Uses AES-256-GCM for encrypting/decrypting OAuth tokens
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Encryption key should be 32 bytes for AES-256
// In production, this should come from environment variables
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || '';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error(
    'TOKEN_ENCRYPTION_KEY must be set and be 64 hex characters (32 bytes)'
  );
}

const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypt a string using AES-256-GCM
 */
export function encrypt(plaintext: string): string {
  try {
    // Generate random IV
    const iv = randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, KEY_BUFFER, iv);

    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return as JSON string
    const result: EncryptedData = {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };

    return JSON.stringify(result);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt a string using AES-256-GCM
 */
export function decrypt(encryptedData: string): string {
  try {
    // Parse encrypted data
    const data: EncryptedData = JSON.parse(encryptedData);

    // Convert from hex
    const encrypted = Buffer.from(data.encrypted, 'hex');
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Generate a random encryption key (for setup)
 * Run this once to generate TOKEN_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}

// Example usage (for testing):
// const key = generateEncryptionKey();
// console.log('Generated key:', key);
// const encrypted = encrypt('my-secret-token');
// console.log('Encrypted:', encrypted);
// const decrypted = decrypt(encrypted);
// console.log('Decrypted:', decrypted);
