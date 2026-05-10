import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../../config/logger.js";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public fields?: Array<{ path: string; message: string }>
  ) {
    super(message);
  }
}

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

export function notFoundHandler(request: Request, _response: Response, next: NextFunction) {
  next(new ApiError(404, "NOT_FOUND", `Route ${request.method} ${request.path} was not found`));
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Request validation failed" },
      fields: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
    });
    return;
  }

  if (error instanceof ApiError) {
    const body: Record<string, unknown> = {
      error: { code: error.code, message: error.message }
    };

    if (error.fields) {
      body.fields = error.fields;
    }

    response.status(error.statusCode).json(body);
    return;
  }

  logger.error({ error }, "Unhandled API error");
  response.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." }
  });
}
