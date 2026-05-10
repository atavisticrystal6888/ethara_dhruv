import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/middleware.js";
import * as userService from "../services/user.service.js";
import { asyncHandler } from "./middleware/error.js";
import { validateRequest } from "./middleware/validate.js";

export const userRouter = Router();

const userSearchQuerySchema = z.object({ q: z.string().optional() });

userRouter.get("/", validateRequest({ query: userSearchQuerySchema }), asyncHandler(async (request, response) => {
	response.json(await userService.searchUsers(requireAuth(request), request.query.q as string | undefined));
}));
