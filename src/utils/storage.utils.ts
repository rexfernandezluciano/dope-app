/** @format */

import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

// Types and interfaces
interface SecureStorageOptions {
  expiration?: Date;
  encrypt?: boolean;
}

interface StorageData {
  value: string;
  expiration?: number;
  encrypted?: boolean;
}

interface EncryptedData {
  data: string;
  iv: string;
  version?: number; // For future migration support
}

// Constants
const DEFAULT_ENCRYPTION_KEY_NAME = "82kedC1LibAGXyt";
const IV_LENGTH = 16; // 128 bits for AES
const ENCRYPTION_VERSION = 1;

// Error classes for better error handling
class SecureStorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'SecureStorageError';
  }
}

class EncryptionError extends SecureStorageError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'EncryptionError';
  }
}

class DecryptionError extends SecureStorageError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'DecryptionError';
  }
}

// Cache for encryption key to avoid repeated SecureStore calls
let cachedEncryptionKey: string | null = null;

/**
 * Generates or retrieves a persistent encryption key
 * Uses caching to improve performance
 */
async function getEncryptionKey(): Promise<string> {
  // Return cached key if available
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  try {
    let key = await SecureStore.getItemAsync(DEFAULT_ENCRYPTION_KEY_NAME);
    
    if (!key) {
      // Generate a more secure key using crypto-random bytes
      const randomBytes = await Crypto.getRandomBytesAsync(32); // 256 bits
      key = Array.from(randomBytes, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');
      
      await SecureStore.setItemAsync(DEFAULT_ENCRYPTION_KEY_NAME, key);
    }
    
    // Cache the key for future use
    cachedEncryptionKey = key;
    return key;
  } catch (error) {
    throw new EncryptionError("Failed to get or generate encryption key", error as Error);
  }
}

/**
 * Converts Uint8Array to base64 string for storage
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...Array.from(bytes)));
}

/**
 * Converts base64 string back to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Web Crypto API encryption (most secure option)
 */
async function encryptWithWebCrypto(data: string, keyString: string, iv: Uint8Array): Promise<string> {
  // Convert hex key string to bytes
  const keyBytes = new Uint8Array(keyString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  
  // Import the key for AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.slice(0, 32), // Use first 32 bytes (256 bits) for AES-256
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt the data
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    cryptoKey,
    dataBytes
  );

  // Convert encrypted data to base64
  const encryptedBytes = new Uint8Array(encryptedBuffer);
  return uint8ArrayToBase64(encryptedBytes);
}

/**
 * Web Crypto API decryption
 */
async function decryptWithWebCrypto(encryptedData: string, keyString: string, iv: Uint8Array): Promise<string> {
  // Convert hex key string to bytes
  const keyBytes = new Uint8Array(keyString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  
  // Import the key for AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.slice(0, 32), // Use first 32 bytes (256 bits) for AES-256
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Convert base64 encrypted data back to bytes
  const encryptedBytes = base64ToUint8Array(encryptedData);

  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    cryptoKey,
    encryptedBytes
  );

  // Convert decrypted bytes back to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * XOR cipher encryption (fallback for environments without Web Crypto API)
 * Note: This is less secure than AES but provides basic obfuscation
 */
function xorEncrypt(data: string, key: string): string {
  const keyBytes = new TextEncoder().encode(key);
  const dataBytes = new TextEncoder().encode(data);
  const encrypted = new Uint8Array(dataBytes.length);
  
  for (let i = 0; i < dataBytes.length; i++) {
    encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return uint8ArrayToBase64(encrypted);
}

/**
 * XOR cipher decryption (fallback)
 */
function xorDecrypt(encryptedData: string, key: string): string {
  const keyBytes = new TextEncoder().encode(key);
  const encryptedBytes = base64ToUint8Array(encryptedData);
  const decrypted = new Uint8Array(encryptedBytes.length);
  
  for (let i = 0; i < encryptedBytes.length; i++) {
    decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypts data using AES-256-GCM (via Web Crypto API when available, fallback to XOR cipher)
 * Returns encrypted data with IV for secure storage
 */
async function encryptData(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = await Crypto.getRandomBytesAsync(IV_LENGTH);
    const ivBase64 = uint8ArrayToBase64(iv);

    // Try to use Web Crypto API if available (more secure)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encryptedResult = await encryptWithWebCrypto(data, key, iv);
        const encryptedData: EncryptedData = {
          data: encryptedResult,
          iv: ivBase64,
          version: ENCRYPTION_VERSION
        };
        return JSON.stringify(encryptedData);
      } catch (webCryptoError) {
        console.warn('Web Crypto API failed, falling back to XOR cipher:', webCryptoError);
      }
    }

    // Fallback to XOR cipher (less secure but works everywhere)
    const encryptedResult = xorEncrypt(data, key + ivBase64);
    const encryptedData: EncryptedData = {
      data: encryptedResult,
      iv: ivBase64,
      version: ENCRYPTION_VERSION
    };

    return JSON.stringify(encryptedData);
  } catch (error) {
    throw new EncryptionError("Failed to encrypt data", error as Error);
  }
}

/**
 * Decrypts data that was encrypted with encryptData
 */
async function decryptData(encryptedDataString: string): Promise<string> {
  try {
    const encryptedData: EncryptedData = JSON.parse(encryptedDataString);
    const { data, iv, version = 1 } = encryptedData;

    if (!data || !iv) {
      throw new Error("Invalid encrypted data format");
    }

    // Handle different encryption versions if needed
    if (version !== ENCRYPTION_VERSION) {
      console.warn(`Decrypting data with version ${version}, current version is ${ENCRYPTION_VERSION}`);
    }

    const key = await getEncryptionKey();
    const ivBytes = base64ToUint8Array(iv);

    // Try to use Web Crypto API if available (more secure)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        return await decryptWithWebCrypto(data, key, ivBytes);
      } catch (webCryptoError) {
        console.warn('Web Crypto API decryption failed, falling back to XOR cipher:', webCryptoError);
      }
    }

    // Fallback to XOR cipher decryption
    return xorDecrypt(data, key + iv);
    
  } catch (error) {
    if (error instanceof DecryptionError) {
      throw error;
    }
    throw new DecryptionError("Failed to decrypt data", error as Error);
  }
}

/**
 * Validates that a key is safe to use with SecureStore
 */
function validateKey(key: string): void {
  if (!key || typeof key !== 'string') {
    throw new SecureStorageError("Key must be a non-empty string");
  }
  
  if (key.length > 100) {
    throw new SecureStorageError("Key is too long (max 100 characters)");
  }
  
  // SecureStore keys should not contain certain characters
  if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
    throw new SecureStorageError("Key contains invalid characters. Use only alphanumeric, dots, underscores, and hyphens");
  }
}

/**
 * Validates storage options
 */
function validateOptions(options: SecureStorageOptions): void {
  if (options.expiration && !(options.expiration instanceof Date)) {
    throw new SecureStorageError("Expiration must be a Date object");
  }
  
  if (options.expiration && options.expiration.getTime() <= Date.now()) {
    throw new SecureStorageError("Expiration date must be in the future");
  }
}

/**
 * Checks if stored data has expired
 */
function isExpired(expiration?: number): boolean {
  return expiration !== undefined && Date.now() > expiration;
}

/**
 * Parses stored data, handling both old and new formats
 */
function parseStoredData(storedData: string): StorageData {
  try {
    const parsed = JSON.parse(storedData);
    
    // New format with metadata
    if (typeof parsed === 'object' && parsed.value !== undefined) {
      return parsed as StorageData;
    }
    
    // Old format - plain string or encrypted string
    return {
      value: storedData,
      encrypted: false
    };
  } catch {
    // Not JSON - treat as plain string
    return {
      value: storedData,
      encrypted: false
    };
  }
}

/**
 * Saves data securely with optional encryption and expiration
 */
export const saveSecure = async (
  key: string, 
  value: string, 
  options: SecureStorageOptions = {}
): Promise<void> => {
  validateKey(key);
  validateOptions(options);
  
  if (!value || typeof value !== 'string') {
    throw new SecureStorageError("Value must be a non-empty string");
  }

  const { expiration, encrypt = false } = options;

  try {
    let processedValue = value;

    // Encrypt if requested
    if (encrypt) {
      processedValue = await encryptData(value);
    }

    // Prepare storage data with metadata
    const storageData: StorageData = {
      value: processedValue,
      encrypted: encrypt,
      ...(expiration && { expiration: expiration.getTime() })
    };

    const dataToStore = JSON.stringify(storageData);
    await SecureStore.setItemAsync(key, dataToStore);
    
  } catch (error) {
    if (error instanceof SecureStorageError) {
      throw error;
    }
    throw new SecureStorageError("Failed to save secure data", error as Error);
  }
};

/**
 * Retrieves and optionally decrypts stored data
 * Returns null if data doesn't exist or has expired
 */
export const getSecure = async (
  key: string, 
  options: SecureStorageOptions = {}
): Promise<string | null> => {
  validateKey(key);
  
  const { encrypt = false } = options;

  try {
    const storedData = await SecureStore.getItemAsync(key);

    if (!storedData) {
      return null;
    }

    const parsedData = parseStoredData(storedData);
    const { value, expiration, encrypted } = parsedData;

    // Check expiration
    if (isExpired(expiration)) {
      await deleteSecure(key); // Clean up expired data
      return null;
    }

    // Handle encryption mismatch warnings
    if (encrypt && !encrypted) {
      console.warn(`Data for key "${key}" was not encrypted but encryption was requested`);
    } else if (!encrypt && encrypted) {
      console.warn(`Data for key "${key}" was encrypted but no decryption was requested`);
    }

    // Decrypt if the data was encrypted
    if (encrypted || encrypt) {
      try {
        return await decryptData(value);
      } catch (error) {
        console.error(`Failed to decrypt data for key "${key}":`, error);
        return null;
      }
    }

    return value;
    
  } catch (error) {
    console.error(`Error retrieving secure data for key "${key}":`, error);
    return null;
  }
};

/**
 * Deletes stored data
 */
export const deleteSecure = async (key: string): Promise<boolean> => {
  validateKey(key);
  
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.error(`Error deleting secure data for key "${key}":`, error);
    return false;
  }
};

/**
 * Checks if a key exists in secure storage
 */
export const existsSecure = async (key: string): Promise<boolean> => {
  validateKey(key);
  
  try {
    const value = await SecureStore.getItemAsync(key);
    return value !== null;
  } catch (error) {
    console.error(`Error checking existence of key "${key}":`, error);
    return false;
  }
};

/**
 * Gets all keys stored in secure storage
 * Note: This is not natively supported by SecureStore, so this is a placeholder
 */
export const getAllKeys = async (): Promise<string[]> => {
  // SecureStore doesn't provide a method to list all keys
  // You'd need to maintain your own index if this functionality is needed
  throw new SecureStorageError("getAllKeys is not supported by SecureStore");
};

/**
 * Clears the encryption key cache (useful for testing or security)
 */
export const clearEncryptionKeyCache = (): void => {
  cachedEncryptionKey = null;
};

/**
 * Utility function to set expiration relative to now
 */
export const createExpiration = {
  minutes: (minutes: number): Date => new Date(Date.now() + minutes * 60 * 1000),
  hours: (hours: number): Date => new Date(Date.now() + hours * 60 * 60 * 1000),
  days: (days: number): Date => new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  weeks: (weeks: number): Date => new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000),
};

// Export error classes for external error handling
export { 
  SecureStorageError, 
  EncryptionError, 
  DecryptionError,
  type SecureStorageOptions,
  type StorageData 
};