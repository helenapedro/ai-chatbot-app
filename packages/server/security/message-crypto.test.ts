import { describe, expect, it } from 'bun:test';

import { decryptMessageContent, encryptMessageContent } from './message-crypto';

describe('message crypto', () => {
   it('encrypts and decrypts message content', () => {
      const plaintext = 'como posso comecar?';
      const encrypted = encryptMessageContent(plaintext);

      expect(encrypted.content).not.toBe(plaintext);
      expect(encrypted.contentIv).toBeString();
      expect(encrypted.contentAuthTag).toBeString();

      const decrypted = decryptMessageContent(
         encrypted.content,
         encrypted.contentIv,
         encrypted.contentAuthTag
      );

      expect(decrypted).toBe(plaintext);
   });

   it('returns plaintext for legacy rows without encryption metadata', () => {
      expect(decryptMessageContent('legacy text', null, null)).toBe(
         'legacy text'
      );
   });
});
