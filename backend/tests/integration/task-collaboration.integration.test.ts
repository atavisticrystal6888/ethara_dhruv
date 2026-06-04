import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { disconnectTestDatabase, resetTestDatabase } from "../helpers/testDatabase.js";

describe("task collaboration integration", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("records status changes and comments in task activity history", async () => {
    const admin = request.agent(app);
    const member = request.agent(app);

    await admin.post("/api/auth/signup").send({ name: "Admin", email: "integration-admin@example.com", password: "Secret123" }).expect(201);
    const memberSignup = await member.post("/api/auth/signup").send({ name: "Member", email: "integration-member@example.com", password: "Secret123" }).expect(201);
    const project = await admin.post("/api/projects").send({ name: "Integration Project" }).expect(201);
    await admin.post(`/api/projects/${project.body.id}/memberships`).send({ userId: memberSignup.body.user.id }).expect(201);

    const task = await admin
      .post(`/api/projects/${project.body.id}/tasks`)
      .send({ title: "Prepare release notes", status: "TODO", assigneeId: memberSignup.body.user.id, dueDate: "2099-06-22" })
      .expect(201);

    await member.patch(`/api/projects/${project.body.id}/tasks/${task.body.id}`).send({ status: "IN_PROGRESS" }).expect(200);
    await member.post(`/api/projects/${project.body.id}/tasks/${task.body.id}/comments`).send({ body: "Draft is ready for review." }).expect(201);

    const detail = await admin.get(`/api/projects/${project.body.id}/tasks/${task.body.id}`).expect(200);
    expect(detail.body.comments).toEqual([
      expect.objectContaining({ body: "Draft is ready for review." })
    ]);
    expect(detail.body.activity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "UPDATED", message: "Status changed from To Do to In Progress" }),
        expect.objectContaining({ type: "COMMENTED", message: "Added a comment" })
      ])
    );
  });
});