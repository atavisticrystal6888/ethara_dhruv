import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import * as sprintService from "../services/sprint.service.js";
import { projectIdParamsSchema } from "../validations/project.schemas.js";
import { sprintCreateSchema, sprintIdParamsSchema, sprintUpdateSchema } from "../validations/sprint.schemas.js";
import { asyncHandler } from "./middleware/error.js";
import { validateRequest } from "./middleware/validate.js";

export const sprintRouter = Router({ mergeParams: true });

sprintRouter.get("/", validateRequest({ params: projectIdParamsSchema }), asyncHandler(async (request, response) => {
  const { projectId } = request.params as { projectId: string };
  response.json(await sprintService.listSprints(requireAuth(request), projectId));
}));

sprintRouter.post("/", validateRequest({ params: projectIdParamsSchema, body: sprintCreateSchema }), asyncHandler(async (request, response) => {
  const { projectId } = request.params as { projectId: string };
  response.status(201).json(await sprintService.createSprint(requireAuth(request), projectId, request.body));
}));

sprintRouter.patch("/:sprintId", validateRequest({ params: sprintIdParamsSchema, body: sprintUpdateSchema }), asyncHandler(async (request, response) => {
  const { projectId, sprintId } = request.params as { projectId: string; sprintId: string };
  response.json(await sprintService.updateSprint(requireAuth(request), projectId, sprintId, request.body));
}));