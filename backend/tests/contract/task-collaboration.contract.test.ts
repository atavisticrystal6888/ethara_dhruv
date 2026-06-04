import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { disconnectTestDatabase, resetTestDatabase } from "../helpers/testDatabase.js";

async function seedTask() {
  const admin = request.agent(app);
  const member = request.agent(app);
  await admin.post("/api/auth/signup").send({ name: "Admin", email: "collab-admin@example.com", password: "Secret123" }).expect(201);
  const memberSignup = await member.post("/api/auth/signup").send({ name: "Member", email: "collab-member@example.com", password: "Secret123" }).expect(201);
  const project = await admin.post("/api/projects").send({ name: "Collaboration Board" }).expect(201);
  await admin.post(`/api/projects/${project.body.id}/memberships`).send({ userId: memberSignup.body.user.id }).expect(201);
  const task = await admin
    .post(`/api/projects/${project.body.id}/tasks`)
    .send({ title: "Review scope", status: "TODO", assigneeId: memberSignup.body.user.id, dueDate: "2099-06-20" })
    .expect(201);

  return { admin, member, project: project.body, task: task.body };
}

describe("task collaboration REST contract", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("returns task detail with comments and activity history", async () => {
    const { admin, project, task } = await seedTask();

    const initial = await admin.get(`/api/projects/${project.id}/tasks/${task.id}`).expect(200);
    expect(initial.body.comments).toEqual([]);
    expect(initial.body.activity).toEqual([
      expect.objectContaining({ type: "CREATED", message: "Created issue" })
    ]);

    await admin.post(`/api/projects/${project.id}/tasks/${task.id}/comments`).send({ body: "Scope looks good." }).expect(201);

    const comments = await admin.get(`/api/projects/${project.id}/tasks/${task.id}/comments`).expect(200);
    expect(comments.body).toEqual([
      expect.objectContaining({ body: "Scope looks good." })
    ]);

    const activity = await admin.get(`/api/projects/${project.id}/tasks/${task.id}/activity`).expect(200);
    expect(activity.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "CREATED", message: "Created issue" }),
        expect.objectContaining({ type: "COMMENTED", message: "Added a comment" })
      ])
    );
  });
});