import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
var currentFile = fileURLToPath(import.meta.url);
var appRoot = path.dirname(currentFile);
var projectRoot = path.resolve(appRoot, "../..");
export default defineConfig({
    envDir: projectRoot,
    plugins: [react()],
    server: {
        port: 5173
    }
});
