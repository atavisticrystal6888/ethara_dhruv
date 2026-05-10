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

  it("lets project owners manage collaborators through project-scoped roles", async () => {
    await request(app).post("/api/auth/signup").send({ name: "Admin", email: "admin@example.com", password: "Secret123" }).expect(201);
    const memberAgent = request.agent(app);
    await memberAgent.post("/api/auth/signup").send({ name: "Member", email: "member@example.com", password: "Secret123" }).expect(201);
    const collaborator = await request(app).post("/api/auth/signup").send({ name: "Collaborator", email: "collaborator@example.com", password: "Secret123" }).expect(201);

    const project = await memberAgent.post("/api/projects").send({ name: "Member Project" }).expect(201);

    const membership = await memberAgent
      .post(`/api/projects/${project.body.id}/memberships`)
      .send({ userId: collaborator.body.user.id, role: "MANAGER" })
      .expect(201);

    expect(membership.body.role).toBe("MANAGER");

    await memberAgent.patch(`/api/projects/${project.body.id}/memberships/${collaborator.body.user.id}`).send({ role: "MEMBER" }).expect(200);
  });
});
