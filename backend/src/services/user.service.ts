import type { AuthenticatedUser } from "../auth/middleware.js";
import { database } from "../models/database.js";
import type { PublicUser } from "./serializers.js";
import { serializeUser } from "./serializers.js";

export async function searchUsers(user: AuthenticatedUser, query?: string) {
  const trimmedQuery = query?.trim();
  const users = (await database.user.findMany({
    where: trimmedQuery
      ? {
          OR: [
            { name: { contains: trimmedQuery, mode: "insensitive" } },
            { email: { contains: trimmedQuery.toLowerCase(), mode: "insensitive" } }
          ]
        }
      : undefined,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
    take: 20
  })) as PublicUser[];
  return users.map(serializeUser);
}
