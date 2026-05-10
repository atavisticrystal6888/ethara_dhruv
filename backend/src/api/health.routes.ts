import { Router } from "express";
import { database } from "../models/database.js";

export const healthRouter = Router();

healthRouter.get("/", async (_request, response) => {
  try {
    await database.$queryRaw`SELECT 1`;
    response.json({ status: "ok", database: "ok" });
  } catch {
    response.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Service dependency unavailable" } });
  }
});
