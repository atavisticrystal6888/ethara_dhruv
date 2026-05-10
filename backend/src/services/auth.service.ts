import { ApiError } from "../api/middleware/error.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signSessionToken } from "../auth/tokens.js";
import { database } from "../models/database.js";
import type { DbUser } from "../types/database.js";
import { hasDatabaseErrorCode } from "../types/database.js";
import type { LoginInput, SignupInput } from "../validations/auth.schemas.js";
import { serializeUser } from "./serializers.js";

export async function signup(input: SignupInput) {
  const userCount = await database.user.count();
  const role = userCount === 0 ? "ADMIN" : "MEMBER";

  try {
    const user = (await database.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })) as Pick<DbUser, "id" | "name" | "email" | "role" | "createdAt">;

    return { user: serializeUser(user), token: await signSessionToken({ sub: user.id, role: user.role }) };
  } catch (error) {
    if (hasDatabaseErrorCode(error, "P2002")) {
      throw new ApiError(409, "EMAIL_EXISTS", "An account with this email already exists");
    }
    throw error;
  }
}

export async function login(input: LoginInput) {
  const user = (await database.user.findUnique({ where: { email: input.email } })) as DbUser | null;
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  return { user: serializeUser(user), token: await signSessionToken({ sub: user.id, role: user.role }) };
}
