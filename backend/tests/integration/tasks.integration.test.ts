import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
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

  it("allows project members to create tasks for members in the same project", async () => {
    const admin = request.agent(app);
    await admin.post("/api/auth/signup").send({ name: "Admin", email: "admin@example.com", password: "Secret123" }).expect(201);
    const member = request.agent(app);
    const memberSignup = await member.post("/api/auth/signup").send({ name: "Member", email: "member@example.com", password: "Secret123" }).expect(201);
    const project = await admin.post("/api/projects").send({ name: "Creator Space" }).expect(201);
    await admin.post(`/api/projects/${project.body.id}/memberships`).send({ userId: memberSignup.body.user.id }).expect(201);

    await member
      .post(`/api/projects/${project.body.id}/tasks`)
      .send({ title: "Member task", status: "TODO", assigneeId: memberSignup.body.user.id, dueDate: "2026-05-21" })
      .expect(201);
  });

  it("supports role delegation, timer tracking, and recurring follow-up creation", async () => {
    const admin = request.agent(app);
    await admin.post("/api/auth/signup").send({ name: "Admin", email: "admin@example.com", password: "Secret123" }).expect(201);
    const manager = request.agent(app);
    const managerSignup = await manager.post("/api/auth/signup").send({ name: "Manager", email: "manager@example.com", password: "Secret123" }).expect(201);
    const member = request.agent(app);
    await member.post("/api/auth/signup").send({ name: "Member", email: "member@example.com", password: "Secret123" }).expect(201);
    const project = await admin.post("/api/projects").send({ name: "Automation Hub" }).expect(201);

    await admin.post(`/api/projects/${project.body.id}/memberships`).send({ userId: managerSignup.body.user.id, role: "MANAGER" }).expect(201);

    const delegatedTask = await manager
      .post(`/api/projects/${project.body.id}/tasks`)
      .send({
        title: "Weekly sync",
        status: "TODO",
        assignmentType: "ROLE",
        assigneeRole: "MANAGER",
        dueDate: "2026-05-21",
        estimatedMinutes: 90,
        recurrencePattern: "WEEKLY"
      })
      .expect(201);

    expect(delegatedTask.body.assignmentType).toBe("ROLE");
    expect(delegatedTask.body.assigneeRole).toBe("MANAGER");

    await manager.patch(`/api/projects/${project.body.id}/tasks/${delegatedTask.body.id}`).send({ timerAction: "START" }).expect(200);
    const completedTask = await manager
      .patch(`/api/projects/${project.body.id}/tasks/${delegatedTask.body.id}`)
      .send({ timerAction: "STOP", status: "DONE" })
      .expect(200);

    expect(completedTask.body.trackedMinutes).toBeGreaterThanOrEqual(1);

    const tasks = await manager.get(`/api/projects/${project.body.id}/tasks`).expect(200);
    expect(tasks.body).toHaveLength(2);
    expect(tasks.body.some((task: { recurrenceParentTaskId: string | null }) => task.recurrenceParentTaskId === delegatedTask.body.id)).toBe(true);
  });
});
