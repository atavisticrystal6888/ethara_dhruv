import { preview } from "vite";

const port = process.env.PORT || "4173";

const server = await preview({
  preview: {
    host: "0.0.0.0",
    port: Number(port)
  }
});

server.printUrls();

const closeServer = async () => {
  await server.httpServer.close();
  process.exit(0);
};

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);