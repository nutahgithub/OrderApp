import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const findEnvFile = (startDirectory: string): string | null => {
  let currentDirectory = startDirectory;

  while (true) {
    const candidate = path.join(currentDirectory, ".env");

    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parentDirectory = path.dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return null;
    }

    currentDirectory = parentDirectory;
  }
};

const currentFile = fileURLToPath(import.meta.url);
const envFile = findEnvFile(path.dirname(currentFile));

if (envFile) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SHADOW_DATABASE_URL: z.string().min(1, "SHADOW_DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  JWT_SECRET: z.string().min(12, "JWT_SECRET must be at least 12 characters"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  AUDIT_LOG_ENABLED: z
    .preprocess((value) => {
      if (typeof value !== "string") {
        return value;
      }

      return value.trim().toLowerCase();
    }, z.enum(["true", "false"]))
    .transform((value) => value === "true")
    .default("true"),
  WEB_APP_URL: z.string().url().default("http://localhost:5173"),
  API_PUBLIC_URL: z.string().url().default("http://localhost:4000"),
  UPLOAD_STORAGE_PROVIDER: z.enum(["local", "minio"]).default("local"),
  LOCAL_UPLOAD_DIR: z.string().min(1).default("uploads"),
  LOCAL_UPLOAD_PUBLIC_PATH: z.string().min(1).default("/uploads"),
  MINIO_ENDPOINT: z.string().url().default("http://localhost:9000"),
  MINIO_PUBLIC_URL: z.string().url().default("http://localhost:9000"),
  MINIO_ACCESS_KEY: z.string().min(1).default("minioadmin"),
  MINIO_SECRET_KEY: z.string().min(1).default("minioadmin"),
  MINIO_BUCKET: z.string().min(1).default("orderapp"),
  MINIO_REGION: z.string().min(1).default("us-east-1")
});

export const env = envSchema.parse(process.env);
