import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import * as dashboardService from "../services/dashboard.service.js";
import { asyncHandler } from "./middleware/error.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", asyncHandler(async (request, response) => {
	response.json(await dashboardService.getDashboardSummary(requireAuth(request)));
}));
