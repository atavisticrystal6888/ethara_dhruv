import { Router } from "express";
import { asyncHandler } from "./middleware/error.js";
import { validateRequest } from "./middleware/validate.js";
import { authenticate, requireAuth } from "../auth/middleware.js";
import { sessionCookieName, sessionCookieOptions } from "../auth/tokens.js";
import * as authService from "../services/auth.service.js";
import { serializeUser } from "../services/serializers.js";
import { loginSchema, signupSchema } from "../validations/auth.schemas.js";

export const authRouter = Router();

authRouter.post("/signup", validateRequest({ body: signupSchema }), asyncHandler(async (request, response) => {
	const session = await authService.signup(request.body);
	response.cookie(sessionCookieName, session.token, sessionCookieOptions()).status(201).json({ user: session.user });
}));

authRouter.post("/login", validateRequest({ body: loginSchema }), asyncHandler(async (request, response) => {
	const session = await authService.login(request.body);
	response.cookie(sessionCookieName, session.token, sessionCookieOptions()).json({ user: session.user });
}));

authRouter.post("/logout", (_request, response) => {
	response.clearCookie(sessionCookieName, sessionCookieOptions()).status(204).send();
});

authRouter.get("/me", authenticate, (request, response) => {
	const user = requireAuth(request);
	response.json(serializeUser(user));
});
