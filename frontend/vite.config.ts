import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000"
    }
  },
  preview: {
    port: Number(process.env.PORT ?? 4173),
    host: "0.0.0.0"
  }
});
