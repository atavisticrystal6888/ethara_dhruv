import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import * as membershipService from "../services/membership.service.js";
import { membershipCreateSchema, membershipParamsSchema } from "../validations/membership.schemas.js";
import { projectIdParamsSchema } from "../validations/project.schemas.js";
import { asyncHandler } from "./middleware/error.js";
import { validateRequest } from "./middleware/validate.js";

export const membershipRouter = Router({ mergeParams: true });

membershipRouter.get("/", validateRequest({ params: projectIdParamsSchema }), asyncHandler(async (request, response) => {
	const { projectId } = request.params as { projectId: string };
	response.json(await membershipService.listMemberships(requireAuth(request), projectId));
}));

membershipRouter.post("/", validateRequest({ params: projectIdParamsSchema, body: membershipCreateSchema }), asyncHandler(async (request, response) => {
	const { projectId } = request.params as { projectId: string };
	response.status(201).json(await membershipService.addMembership(requireAuth(request), projectId, request.body));
}));

membershipRouter.delete("/:userId", validateRequest({ params: membershipParamsSchema }), asyncHandler(async (request, response) => {
	const { projectId, userId } = request.params as { projectId: string; userId: string };
	await membershipService.removeMembership(requireAuth(request), projectId, userId);
	response.status(204).send();
}));
