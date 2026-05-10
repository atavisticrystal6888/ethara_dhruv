import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import * as taskService from "../services/task.service.js";
import { projectIdParamsSchema } from "../validations/project.schemas.js";
import { taskCreateSchema, taskIdParamsSchema, taskListQuerySchema, taskUpdateSchema } from "../validations/task.schemas.js";
import { asyncHandler } from "./middleware/error.js";
import { validateRequest } from "./middleware/validate.js";

export const taskRouter = Router({ mergeParams: true });

taskRouter.get("/", validateRequest({ params: projectIdParamsSchema, query: taskListQuerySchema }), asyncHandler(async (request, response) => {
	const { projectId } = request.params as { projectId: string };
	response.json(await taskService.listTasks(requireAuth(request), projectId, request.query as { status?: string; assigneeId?: string }));
}));

taskRouter.post("/", validateRequest({ params: projectIdParamsSchema, body: taskCreateSchema }), asyncHandler(async (request, response) => {
	const { projectId } = request.params as { projectId: string };
	response.status(201).json(await taskService.createTask(requireAuth(request), projectId, request.body));
}));

taskRouter.get("/:taskId", validateRequest({ params: taskIdParamsSchema }), asyncHandler(async (request, response) => {
	const { projectId, taskId } = request.params as { projectId: string; taskId: string };
	response.json(await taskService.getTask(requireAuth(request), projectId, taskId));
}));

taskRouter.patch("/:taskId", validateRequest({ params: taskIdParamsSchema, body: taskUpdateSchema }), asyncHandler(async (request, response) => {
	const { projectId, taskId } = request.params as { projectId: string; taskId: string };
	response.json(await taskService.updateTask(requireAuth(request), projectId, taskId, request.body));
}));

taskRouter.delete("/:taskId", validateRequest({ params: taskIdParamsSchema }), asyncHandler(async (request, response) => {
	const { projectId, taskId } = request.params as { projectId: string; taskId: string };
	await taskService.deleteTask(requireAuth(request), projectId, taskId);
	response.status(204).send();
}));
