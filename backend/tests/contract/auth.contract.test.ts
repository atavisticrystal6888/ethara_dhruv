import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { disconnectTestDatabase, resetTestDatabase } from "../helpers/testDatabase.js";

describe("auth REST contract", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("supports signup, me, logout, and login with safe user responses", async () => {
    const agent = request.agent(app);

    const signup = await agent
      .post("/api/auth/signup")
      .send({ name: "Admin User", email: "admin@example.com", password: "Secret123" })
      .expect(201);

    expect(signup.body.user).toMatchObject({ email: "admin@example.com", role: "ADMIN" });
    expect(signup.body.user.passwordHash).toBeUndefined();
    expect(signup.headers["set-cookie"]?.join(";")).toContain("fswa_session");

    const me = await agent.get("/api/auth/me").expect(200);
    expect(me.body.email).toBe("admin@example.com");

    await agent.post("/api/auth/logout").expect(204);
    await agent.get("/api/auth/me").expect(401);

    await agent.post("/api/auth/login").send({ email: "admin@example.com", password: "Secret123" }).expect(200);
  });

  it("returns validation and conflict responses for invalid signup attempts", async () => {
    await request(app).post("/api/auth/signup").send({ name: "A", email: "bad", password: "short" }).expect(400);

    await request(app)
      .post("/api/auth/signup")
      .send({ name: "Admin User", email: "admin@example.com", password: "Secret123" })
      .expect(201);

    await request(app)
      .post("/api/auth/signup")
      .send({ name: "Admin User", email: "ADMIN@example.com", password: "Secret123" })
      .expect(409);
  });
});
