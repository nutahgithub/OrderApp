import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const currentFile = fileURLToPath(import.meta.url);
const appRoot = path.dirname(currentFile);
const projectRoot = path.resolve(appRoot, "../..");

export default defineConfig({
  envDir: projectRoot,
  plugins: [react()],
  server: {
    port: 5173
  }
});
