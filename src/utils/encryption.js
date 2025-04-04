// Encryption utilities for secure message handling
import CryptoJS from 'crypto-js';

/**
 * Encrypts a message text using AES encryption
 * @param {string} messageText - The plain text message to encrypt
 * @param {string} secretKey - The secret key for encryption (should be shared between participants)
 * @returns {string} - The encrypted message
 */
export const encryptMessage = (messageText, secretKey) => {
  try {
    if (!messageText || !secretKey) {
      console.error('Message or key missing for encryption');
      return '';
    }
    
    return CryptoJS.AES.encrypt(messageText, secretKey).toString();
  } catch (error) {
    console.error('Error encrypting message:', error);
    return '';
  }
};

/**
 * Decrypts an encrypted message using AES decryption
 * @param {string} encryptedMessage - The encrypted message to decrypt
 * @param {string} secretKey - The secret key for decryption (must match encryption key)
 * @returns {string} - The decrypted message text
 */
export const decryptMessage = (encryptedMessage, secretKey) => {
  try {
    if (!encryptedMessage || !secretKey) {
      console.error('Encrypted message or key missing for decryption');
      return '';
    }
    
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting message:', error);
    return '🔒 [Encrypted message - unable to decrypt]';
  }
};

/**
 * Generates a chat key for a specific conversation between two users
 * This key will be used to encrypt and decrypt messages
 * @param {string} userId1 - First user's ID
 * @param {string} userId2 - Second user's ID
 * @returns {string} - A deterministic chat encryption key
 */
export const generateChatKey = (userId1, userId2) => {
  // Sort IDs to ensure the same key is generated regardless of order
  const sortedIds = [userId1, userId2].sort();
  
  // Create a deterministic key based on both user IDs
  // In a production app, you might want a more sophisticated key generation mechanism
  return CryptoJS.SHA256(`${sortedIds[0]}_${sortedIds[1]}_encryption_key`).toString();
};