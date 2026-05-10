import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { authRouter } from "./api/auth.routes.js";
import { dashboardRouter } from "./api/dashboard.routes.js";
import { errorHandler, notFoundHandler } from "./api/middleware/error.js";
import { projectRouter } from "./api/project.routes.js";
import { healthRouter } from "./api/health.routes.js";
import { userRouter } from "./api/user.routes.js";
import { authenticate } from "./auth/middleware.js";
import { env } from "./config/env.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", authenticate, userRouter);
app.use("/api/projects", authenticate, projectRouter);
app.use("/api/dashboard", authenticate, dashboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);
