import { jwtVerify, SignJWT } from "jose";
import { env } from "../config/env.js";
import type { Role } from "../types/domain.js";

export const sessionCookieName = "fswa_session";

export type SessionClaims = {
  sub: string;
  role: Role;
};

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function signSessionToken(claims: SessionClaims) {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, secret);
  if (!payload.sub || (payload.role !== "ADMIN" && payload.role !== "MEMBER")) {
    throw new Error("Invalid session token");
  }
  return { sub: payload.sub, role: payload.role };
}

export function sessionCookieOptions() {
  const cookieDomain = env.COOKIE_DOMAIN.trim();

  return {
    httpOnly: true,
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE,
    domain: cookieDomain === "" || cookieDomain === "localhost" ? undefined : cookieDomain,
    path: "/",
    maxAge: 2 * 60 * 60 * 1000
  };
}
