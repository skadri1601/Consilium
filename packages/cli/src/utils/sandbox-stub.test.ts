import { describe, it, expect } from "vitest";
import {
  isSandboxAvailable,
  runInSandbox,
  describeSandboxStub,
} from "./sandbox-stub";

describe("sandbox-stub", () => {
  describe("isSandboxAvailable", () => {
    it("returns available=false with a descriptive reason", () => {
      const result = isSandboxAvailable();
      expect(result.available).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.reason).toContain("Native sandbox not yet implemented");
    });

    it("returns a stable reason string referencing the design spec", () => {
      const result = isSandboxAvailable();
      expect(result.reason).toContain("cli-sandbox-design");
      expect(result.reason).toContain("--worktree");
    });
  });

  describe("describeSandboxStub", () => {
    it("returns the same description as the availability reason", () => {
      const desc = describeSandboxStub();
      const avail = isSandboxAvailable();
      expect(desc).toBe(avail.reason);
    });

    it("returns a non-empty string", () => {
      expect(describeSandboxStub().length).toBeGreaterThan(0);
    });
  });

  describe("runInSandbox", () => {
    it("rejects with an error explaining the stub state", async () => {
      await expect(runInSandbox("ls", ["-la"])).rejects.toThrow(
        /Native sandbox not yet implemented/,
      );
    });

    it("rejects regardless of cmd/args", async () => {
      await expect(runInSandbox("", [])).rejects.toThrow();
      await expect(runInSandbox("any-cmd", ["a", "b", "c"])).rejects.toThrow();
    });
  });
});
