import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

function resetEnv(nextEnv: NodeJS.ProcessEnv) {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }

  Object.assign(process.env, nextEnv);
}

async function importCookieOptions(overrides: NodeJS.ProcessEnv = {}) {
  vi.resetModules();
  resetEnv({
    ...originalEnv,
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/fswa",
    JWT_SECRET: "development-secret-change-me",
    COOKIE_SECURE: "false",
    COOKIE_DOMAIN: "localhost",
    COOKIE_SAME_SITE: "lax",
    CORS_ORIGIN: "http://localhost:5173",
    PORT: "3000",
    NODE_ENV: "test",
    ...overrides
  });

  const { sessionCookieOptions } = await import("../../src/auth/tokens.js");
  return sessionCookieOptions;
}

describe("sessionCookieOptions", () => {
  afterEach(() => {
    vi.resetModules();
    resetEnv(originalEnv);
  });

  it("omits the domain when COOKIE_DOMAIN is blank", async () => {
    const sessionCookieOptions = await importCookieOptions({ COOKIE_DOMAIN: "" });

    expect(sessionCookieOptions()).toMatchObject({
      domain: undefined,
      sameSite: "lax",
      secure: false
    });
  });

  it("supports SameSite none when secure cookies are enabled", async () => {
    const sessionCookieOptions = await importCookieOptions({
      COOKIE_DOMAIN: "",
      COOKIE_SAME_SITE: "none",
      COOKIE_SECURE: "true"
    });

    expect(sessionCookieOptions()).toMatchObject({
      domain: undefined,
      sameSite: "none",
      secure: true
    });
  });

  it("rejects SameSite none without secure cookies", async () => {
    await expect(importCookieOptions({ COOKIE_SAME_SITE: "none", COOKIE_SECURE: "false" })).rejects.toThrow(
      /COOKIE_SECURE must be true/
    );
  });
});