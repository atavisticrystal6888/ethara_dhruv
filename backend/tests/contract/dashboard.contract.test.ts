import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { disconnectTestDatabase, resetTestDatabase } from "../helpers/testDatabase.js";

describe("dashboard REST contract", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("returns role-scoped summary counts", async () => {
    const admin = request.agent(app);
    await admin.post("/api/auth/signup").send({ name: "Admin", email: "admin@example.com", password: "Secret123" }).expect(201);
    const member = request.agent(app);
    const memberSignup = await member.post("/api/auth/signup").send({ name: "Member", email: "member@example.com", password: "Secret123" }).expect(201);
    const project = await admin.post("/api/projects").send({ name: "Launch Plan" }).expect(201);
    await admin.post(`/api/projects/${project.body.id}/memberships`).send({ userId: memberSignup.body.user.id }).expect(201);
    await admin.post(`/api/projects/${project.body.id}/tasks`).send({ title: "Overdue", status: "TODO", assigneeId: memberSignup.body.user.id, dueDate: "2020-01-01" }).expect(201);

    const dashboard = await member.get("/api/dashboard").expect(200);
    expect(dashboard.body).toMatchObject({ projectCount: 1, totalTasks: 1, assignedTasks: 1, overdueTasks: 1 });
  });
});
