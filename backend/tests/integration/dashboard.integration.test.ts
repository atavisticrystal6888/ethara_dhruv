import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { disconnectTestDatabase, resetTestDatabase } from "../helpers/testDatabase.js";

describe("dashboard aggregation", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("counts status totals and excludes Done tasks from overdue totals", async () => {
    const admin = request.agent(app);
    await admin.post("/api/auth/signup").send({ name: "Admin", email: "admin@example.com", password: "Secret123" }).expect(201);
    const member = request.agent(app);
    const memberSignup = await member.post("/api/auth/signup").send({ name: "Member", email: "member@example.com", password: "Secret123" }).expect(201);
    const project = await admin.post("/api/projects").send({ name: "Launch Plan" }).expect(201);
    await admin.post(`/api/projects/${project.body.id}/memberships`).send({ userId: memberSignup.body.user.id }).expect(201);
    await admin.post(`/api/projects/${project.body.id}/tasks`).send({ title: "Todo", status: "TODO", assigneeId: memberSignup.body.user.id, dueDate: "2020-01-01" }).expect(201);
    await admin.post(`/api/projects/${project.body.id}/tasks`).send({ title: "Progress", status: "IN_PROGRESS", assigneeId: memberSignup.body.user.id, dueDate: "2099-05-20" }).expect(201);
    await admin.post(`/api/projects/${project.body.id}/tasks`).send({ title: "Done", status: "DONE", assigneeId: memberSignup.body.user.id, dueDate: "2020-01-01" }).expect(201);

    const dashboard = await admin.get("/api/dashboard").expect(200);
    expect(dashboard.body.statusTotals).toEqual({ TODO: 1, IN_PROGRESS: 1, DONE: 1 });
    expect(dashboard.body.overdueTasks).toBe(1);
  });
});
