import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;

const encryptionKey = Buffer.from(env.CHATBOT_ENCRYPTION_KEY, 'hex');

type EncryptedMessageContent = {
   content: string;
   contentAuthTag: string;
   contentIv: string;
};

export const encryptMessageContent = (
   plaintext: string
): EncryptedMessageContent => {
   const iv = randomBytes(IV_LENGTH_BYTES);
   const cipher = createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);
   const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
   ]);

   return {
      content: encrypted.toString('base64'),
      contentIv: iv.toString('base64'),
      contentAuthTag: cipher.getAuthTag().toString('base64'),
   };
};

export const decryptMessageContent = (
   content: string,
   contentIv: string | null,
   contentAuthTag: string | null
) => {
   if (!contentIv || !contentAuthTag) {
      return content;
   }

   try {
      const decipher = createDecipheriv(
         ENCRYPTION_ALGORITHM,
         encryptionKey,
         Buffer.from(contentIv, 'base64')
      );
      decipher.setAuthTag(Buffer.from(contentAuthTag, 'base64'));

      const decrypted = Buffer.concat([
         decipher.update(Buffer.from(content, 'base64')),
         decipher.final(),
      ]);

      return decrypted.toString('utf8');
   } catch {
      throw new AppError('Failed to decrypt stored message content.', 500);
   }
};
