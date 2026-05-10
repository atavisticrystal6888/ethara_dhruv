import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../api/middleware/error.js";
import { database } from "../models/database.js";
import type { Role } from "../types/domain.js";
import { sessionCookieName, verifySessionToken } from "./tokens.js";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(request: Request, _response: Response, next: NextFunction) {
  try {
    const token = request.cookies?.[sessionCookieName];
    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication is required");
    }

    const claims = await verifySessionToken(token);
    const user = (await database.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })) as AuthenticatedUser | null;

    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication is required");
    }

    request.user = user;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "UNAUTHORIZED", "Authentication is required"));
  }
}

export function requireAuth(request: Request): AuthenticatedUser {
  if (!request.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication is required");
  }
  return request.user;
}
