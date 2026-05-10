import { database } from "../../src/models/database.js";

export async function resetTestDatabase() {
  await database.task.deleteMany();
  await database.membership.deleteMany();
  await database.project.deleteMany();
  await database.user.deleteMany();
}

export async function disconnectTestDatabase() {
  await database.$disconnect();
}
