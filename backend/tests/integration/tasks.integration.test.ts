import request from "supertest";
import { afterAll, beforeEach, describe, it } from "vitest";
import { app } from "../../src/app.js";
import { disconnectTestDatabase, resetTestDatabase } from "../helpers/testDatabase.js";

describe("task assignment and status permissions", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("rejects cross-project assignees and allows assigned Members to update status only", async () => {
    const admin = request.agent(app);
    await admin.post("/api/auth/signup").send({ name: "Admin", email: "admin@example.com", password: "Secret123" }).expect(201);
    const member = request.agent(app);
    const memberSignup = await member.post("/api/auth/signup").send({ name: "Member", email: "member@example.com", password: "Secret123" }).expect(201);
    const outsider = request.agent(app);
    const outsiderSignup = await outsider.post("/api/auth/signup").send({ name: "Outsider", email: "outsider@example.com", password: "Secret123" }).expect(201);
    const project = await admin.post("/api/projects").send({ name: "Launch Plan" }).expect(201);
    await admin.post(`/api/projects/${project.body.id}/memberships`).send({ userId: memberSignup.body.user.id }).expect(201);

    await admin
      .post(`/api/projects/${project.body.id}/tasks`)
      .send({ title: "Bad assignment", status: "TODO", assigneeId: outsiderSignup.body.user.id, dueDate: "2026-05-20" })
      .expect(400);

    const task = await admin
      .post(`/api/projects/${project.body.id}/tasks`)
      .send({ title: "Good assignment", status: "TODO", assigneeId: memberSignup.body.user.id, dueDate: "2026-05-20" })
      .expect(201);

    await member.patch(`/api/projects/${project.body.id}/tasks/${task.body.id}`).send({ status: "DONE" }).expect(200);
    await member.patch(`/api/projects/${project.body.id}/tasks/${task.body.id}`).send({ title: "Nope" }).expect(403);
  });
});
