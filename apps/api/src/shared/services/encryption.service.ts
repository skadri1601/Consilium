import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

@Injectable()
export class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly tagPosition = this.saltLength + this.ivLength;
  private readonly encryptedPosition = this.tagPosition + this.tagLength;

  private getKey(): Buffer {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY environment variable is not set");
    }

    // If key is hex string, convert it
    if (encryptionKey.length === 64) {
      return Buffer.from(encryptionKey, "hex");
    }

    // Otherwise, derive key from string using PBKDF2
    const salt = process.env.ENCRYPTION_SALT || "consilium-salt";
    return crypto.pbkdf2Sync(encryptionKey, salt, 100000, this.keyLength, "sha512");
  }

  encrypt(text: string): string {
    if (!text) {
      return text;
    }

    try {
      const key = this.getKey();
      const iv = crypto.randomBytes(this.ivLength);
      const salt = crypto.randomBytes(this.saltLength);

      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      cipher.setAAD(salt);

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      const tag = cipher.getAuthTag();

      // Combine salt + iv + tag + encrypted
      return Buffer.concat([salt, iv, tag, Buffer.from(encrypted, "hex")]).toString("base64");
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData) {
      return encryptedData;
    }

    try {
      const key = this.getKey();
      const data = Buffer.from(encryptedData, "base64");

      const salt = data.subarray(0, this.saltLength);
      const iv = data.subarray(this.saltLength, this.tagPosition);
      const tag = data.subarray(this.tagPosition, this.encryptedPosition);
      const encrypted = data.subarray(this.encryptedPosition);

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAAD(salt);
      decipher.setAuthTag(tag);

      const decryptedBuffer = decipher.update(encrypted);
      const finalBuffer = decipher.final();
      const decrypted = Buffer.concat([decryptedBuffer, finalBuffer]).toString("utf8");

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
}

