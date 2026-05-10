import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { disconnectTestDatabase, resetTestDatabase } from "../helpers/testDatabase.js";

async function signup(name: string, email: string) {
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/signup").send({ name, email, password: "Secret123" }).expect(201);
  return { agent, user: response.body.user };
}

describe("project, membership, and user lookup REST contracts", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("lets Admin create projects, search users, and add Members", async () => {
    const admin = await signup("Admin User", "admin@example.com");
    const member = await signup("Member User", "member@example.com");

    const project = await admin.agent
      .post("/api/projects")
      .send({ name: "Launch Plan", description: "Submission sprint" })
      .expect(201);

    const users = await admin.agent.get("/api/users?q=member").expect(200);
    expect(users.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: member.user.id, email: "member@example.com" })]));

    const membership = await admin.agent
      .post(`/api/projects/${project.body.id}/memberships`)
      .send({ userId: member.user.id })
      .expect(201);

    expect(membership.body.user.email).toBe("member@example.com");

    await member.agent.get("/api/projects").expect(200);
    await member.agent.post(`/api/projects/${project.body.id}/memberships`).send({ userId: admin.user.id }).expect(403);
  });
});
