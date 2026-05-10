import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (request, _response, next) => {
    if (schemas.body) {
      request.body = schemas.body.parse(request.body);
    }
    if (schemas.params) {
      request.params = schemas.params.parse(request.params);
    }
    if (schemas.query) {
      schemas.query.parse(request.query);
    }
    next();
  };
}
