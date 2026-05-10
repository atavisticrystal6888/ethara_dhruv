process.env.NODE_ENV = "test";
process.env.JWT_SECRET ??= "test-secret-change-me";
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/fswa_test";
process.env.CORS_ORIGIN ??= "http://localhost:5173";
