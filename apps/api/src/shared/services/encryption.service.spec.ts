import { EncryptionService } from "./encryption.service";

describe("EncryptionService", () => {
  let service: EncryptionService;
  const originalEnv = process.env;

  beforeEach(() => {
    // Set up test encryption key (64 hex chars = 32 bytes)
    process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    service = new EncryptionService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("encrypt", () => {
    it("should encrypt a string", () => {
      const plaintext = "sk-test-api-key-12345";
      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(typeof encrypted).toBe("string");
    });

    it("should return different ciphertext for same plaintext (random IV)", () => {
      const plaintext = "sk-test-api-key-12345";
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should return empty string for empty input", () => {
      const result = service.encrypt("");
      expect(result).toBe("");
    });

    it("should return null/undefined for null/undefined input", () => {
      expect(service.encrypt(null as any)).toBeFalsy();
      expect(service.encrypt(undefined as any)).toBeFalsy();
    });

    it("should handle special characters", () => {
      const plaintext = "key-with-special-chars!@#$%^&*()_+-={}[]|\\:\";<>?,./~`";
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle unicode characters", () => {
      const plaintext = "key-with-unicode-日本語-中文-한국어-🔐";
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long strings", () => {
      const plaintext = "a".repeat(10000);
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe("decrypt", () => {
    it("should decrypt an encrypted string back to original", () => {
      const plaintext = "sk-test-api-key-12345";
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should return empty string for empty input", () => {
      const result = service.decrypt("");
      expect(result).toBe("");
    });

    it("should return null/undefined for null/undefined input", () => {
      expect(service.decrypt(null as any)).toBeFalsy();
      expect(service.decrypt(undefined as any)).toBeFalsy();
    });

    it("should throw error for invalid ciphertext", () => {
      expect(() => service.decrypt("invalid-base64")).toThrow();
    });

    it("should throw error for tampered ciphertext", () => {
      const plaintext = "sk-test-api-key-12345";
      const encrypted = service.encrypt(plaintext);
      
      // Tamper with the ciphertext
      const tamperedEncrypted = encrypted.slice(0, -5) + "XXXXX";
      
      expect(() => service.decrypt(tamperedEncrypted)).toThrow();
    });

    it("should throw error when encryption key is wrong", () => {
      const plaintext = "sk-test-api-key-12345";
      const encrypted = service.encrypt(plaintext);

      // Change the encryption key
      process.env.ENCRYPTION_KEY = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
      const newService = new EncryptionService();

      expect(() => newService.decrypt(encrypted)).toThrow();
    });
  });

  describe("round-trip encryption", () => {
    const testCases = [
      { name: "OpenAI key", value: "sk-proj-abcdefghijklmnop123456789" },
      { name: "Anthropic key", value: "sk-ant-api03-abcdef123456" },
      { name: "Google key", value: "AIzaSyABCDEFGHIJKLMNOP123456" },
      { name: "short string", value: "short" },
      { name: "empty spaces", value: "   spaces   " },
      { name: "newlines", value: "line1\nline2\nline3" },
      { name: "JSON", value: '{"key": "value", "nested": {"a": 1}}' },
    ];

    testCases.forEach(({ name, value }) => {
      it(`should correctly encrypt and decrypt: ${name}`, () => {
        const encrypted = service.encrypt(value);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(value);
      });
    });
  });

  describe("encryption key handling", () => {
    it("should throw error when ENCRYPTION_KEY is not set", () => {
      delete process.env.ENCRYPTION_KEY;
      const newService = new EncryptionService();

      expect(() => newService.encrypt("test")).toThrow("ENCRYPTION_KEY");
    });

    it("should work with string key (not hex)", () => {
      process.env.ENCRYPTION_KEY = "my-secret-password-that-is-long-enough";
      const newService = new EncryptionService();

      const plaintext = "test-value";
      const encrypted = newService.encrypt(plaintext);
      const decrypted = newService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });
});
