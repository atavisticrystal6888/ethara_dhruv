import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { disconnectTestDatabase, resetTestDatabase } from "../helpers/testDatabase.js";

async function seedProjectWithMember() {
  const admin = request.agent(app);
  const member = request.agent(app);
  await admin.post("/api/auth/signup").send({ name: "Admin", email: "admin@example.com", password: "Secret123" }).expect(201);
  const memberResponse = await member.post("/api/auth/signup").send({ name: "Member", email: "member@example.com", password: "Secret123" }).expect(201);
  const project = await admin.post("/api/projects").send({ name: "Launch Plan" }).expect(201);
  await admin.post(`/api/projects/${project.body.id}/memberships`).send({ userId: memberResponse.body.user.id }).expect(201);
  return { admin, member, memberUser: memberResponse.body.user, project: project.body };
}

describe("task REST contract", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("supports list, create, get, update, and delete endpoints", async () => {
    const { admin, memberUser, project } = await seedProjectWithMember();

    const created = await admin
      .post(`/api/projects/${project.id}/tasks`)
      .send({ title: "Draft demo", status: "TODO", assigneeId: memberUser.id, dueDate: "2026-05-20" })
      .expect(201);

    expect(created.body).toMatchObject({ title: "Draft demo", status: "TODO", isOverdue: false });

    await admin.get(`/api/projects/${project.id}/tasks`).expect(200);
    await admin.get(`/api/projects/${project.id}/tasks/${created.body.id}`).expect(200);
    await admin.patch(`/api/projects/${project.id}/tasks/${created.body.id}`).send({ status: "IN_PROGRESS" }).expect(200);
    await admin.delete(`/api/projects/${project.id}/tasks/${created.body.id}`).expect(204);
  });
});
