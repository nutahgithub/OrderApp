import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentFile = fileURLToPath(import.meta.url);
const apiRoot = path.resolve(path.dirname(currentFile), "..");
const projectRoot = path.resolve(apiRoot, "../..");
const rootEnvPath = path.resolve(projectRoot, ".env");

dotenv.config({ path: rootEnvPath });

const prismaBin = path.resolve(projectRoot, "node_modules/prisma/build/index.js");
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [prismaBin, ...args], {
  cwd: apiRoot,
  env: process.env,
  stdio: "inherit"
});

process.exit(result.status ?? 1);

