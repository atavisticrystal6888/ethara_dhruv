import { prisma } from "../../src/models/prisma.js";

export async function resetTestDatabase() {
  await prisma.task.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

export async function disconnectTestDatabase() {
  await prisma.$disconnect();
}
