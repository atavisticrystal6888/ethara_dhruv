import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { disconnectTestDatabase, resetTestDatabase } from "../helpers/testDatabase.js";

describe("first Admin bootstrap and RBAC", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("creates the first user as Admin and later self-registered users as Members", async () => {
    const admin = await request(app).post("/api/auth/signup").send({ name: "Admin", email: "admin@example.com", password: "Secret123" }).expect(201);
    const member = await request(app).post("/api/auth/signup").send({ name: "Member", email: "member@example.com", password: "Secret123" }).expect(201);

    expect(admin.body.user.role).toBe("ADMIN");
    expect(member.body.user.role).toBe("MEMBER");
  });

  it("denies Admin-only project actions for Members", async () => {
    await request(app).post("/api/auth/signup").send({ name: "Admin", email: "admin@example.com", password: "Secret123" }).expect(201);
    const memberAgent = request.agent(app);
    await memberAgent.post("/api/auth/signup").send({ name: "Member", email: "member@example.com", password: "Secret123" }).expect(201);

    await memberAgent.post("/api/projects").send({ name: "Member Project" }).expect(403);
  });
});
