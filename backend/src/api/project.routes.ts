import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import * as projectService from "../services/project.service.js";
import { projectCreateSchema, projectIdParamsSchema, projectUpdateSchema } from "../validations/project.schemas.js";
import { membershipRouter } from "./membership.routes.js";
import { asyncHandler } from "./middleware/error.js";
import { validateRequest } from "./middleware/validate.js";
import { sprintRouter } from "./sprint.routes.js";
import { taskRouter } from "./task.routes.js";

export const projectRouter = Router();

projectRouter.get("/", asyncHandler(async (request, response) => {
	response.json(await projectService.listProjects(requireAuth(request)));
}));

projectRouter.post("/", validateRequest({ body: projectCreateSchema }), asyncHandler(async (request, response) => {
	response.status(201).json(await projectService.createProject(requireAuth(request), request.body));
}));

projectRouter.use("/:projectId/memberships", membershipRouter);
projectRouter.use("/:projectId/sprints", sprintRouter);
projectRouter.use("/:projectId/tasks", taskRouter);

projectRouter.get("/:projectId", validateRequest({ params: projectIdParamsSchema }), asyncHandler(async (request, response) => {
	const { projectId } = request.params as { projectId: string };
	response.json(await projectService.getProject(requireAuth(request), projectId));
}));

projectRouter.patch("/:projectId", validateRequest({ params: projectIdParamsSchema, body: projectUpdateSchema }), asyncHandler(async (request, response) => {
	const { projectId } = request.params as { projectId: string };
	response.json(await projectService.updateProject(requireAuth(request), projectId, request.body));
}));

projectRouter.delete("/:projectId", validateRequest({ params: projectIdParamsSchema }), asyncHandler(async (request, response) => {
	const { projectId } = request.params as { projectId: string };
	await projectService.deleteProject(requireAuth(request), projectId);
	response.status(204).send();
}));
