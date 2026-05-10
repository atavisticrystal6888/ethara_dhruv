import { z } from "zod";

const booleanFromString = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return value;
}, z.boolean());

const envSchema = z.object({
  DATABASE_URL: z.string().url().default("postgresql://postgres:postgres@localhost:5432/fswa"),
  JWT_SECRET: z.string().min(16).default("development-secret-change-me"),
  COOKIE_SECURE: booleanFromString.default(false),
  COOKIE_DOMAIN: z.string().optional().default("localhost"),
  COOKIE_SAME_SITE: z.enum(["lax", "none", "strict"]).default("lax"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
}).superRefine((value, context) => {
  if (value.COOKIE_SAME_SITE === "none" && !value.COOKIE_SECURE) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["COOKIE_SECURE"],
      message: "COOKIE_SECURE must be true when COOKIE_SAME_SITE is none"
    });
  }
});

export const env = envSchema.parse(process.env);
