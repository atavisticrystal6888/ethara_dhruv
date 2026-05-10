import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const host = "0.0.0.0";
const port = Number(process.env.PORT || "4173");
const distDir = resolve(process.cwd(), "dist");
const indexFile = resolve(distDir, "index.html");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

if (!existsSync(indexFile)) {
  console.error("Missing dist/index.html. Run npm run build before starting the frontend service.");
  process.exit(1);
}

const resolveAssetPath = (pathname) => {
  const relativePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = resolve(distDir, `.${relativePath}`);

  if (!filePath.startsWith(distDir)) {
    return null;
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    return filePath;
  }

  return extname(pathname) ? null : indexFile;
};

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const filePath = resolveAssetPath(url.pathname);

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const contentType = mimeTypes[extname(filePath)] || "application/octet-stream";

  response.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Frontend server listening on http://${host}:${port}`);
});

const closeServer = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);