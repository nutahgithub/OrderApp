import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../shared/errors/app-error.js";
import { ErrorCode } from "../shared/errors/error-catalog.js";
import type { UploadImageDto, UploadImageInput } from "../types/upload.types.js";
import { recordAuditLog } from "./audit-log.service.js";

const s3Service = "s3";

const extensionByContentType: Record<UploadImageInput["contentType"], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

const contentTypesBySignature = [
  {
    contentType: "image/jpeg",
    matches: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  },
  {
    contentType: "image/png",
    matches: (buffer: Buffer) =>
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
  },
  {
    contentType: "image/webp",
    matches: (buffer: Buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
  }
] satisfies Array<{
  contentType: UploadImageInput["contentType"];
  matches: (buffer: Buffer) => boolean;
}>;

const sha256Hex = (value: string | Buffer): string => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

const hmac = (key: Buffer | string, value: string): Buffer => {
  return crypto.createHmac("sha256", key).update(value).digest();
};

const encodeS3Path = (value: string): string => {
  return value
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
};

const buildObjectKey = (tenantId: string, fileName: string, contentType: UploadImageInput["contentType"]): string => {
  const safeTenantId = tenantId
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const safeBaseName = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = crypto.randomUUID();

  return `tenants/${safeTenantId || "tenant"}/menus/${safeBaseName || "menu-image"}-${suffix}.${extensionByContentType[contentType]}`;
};

const decodeImage = (input: UploadImageInput): Buffer => {
  const imageBuffer = Buffer.from(input.dataBase64, "base64");

  if (imageBuffer.length === 0 || imageBuffer.length > env.UPLOAD_MAX_IMAGE_BYTES) {
    throw new AppError(ErrorCode.InvalidUpload, {
      details: {
        maxImageBytes: env.UPLOAD_MAX_IMAGE_BYTES,
        actualImageBytes: imageBuffer.length
      }
    });
  }

  const detectedContentType = contentTypesBySignature.find((signature) => signature.matches(imageBuffer))?.contentType;

  if (detectedContentType !== input.contentType) {
    throw new AppError(ErrorCode.InvalidUpload, {
      details: {
        declaredContentType: input.contentType,
        detectedContentType: detectedContentType ?? null
      }
    });
  }

  return imageBuffer;
};

const buildPublicUrl = (baseUrl: string, ...parts: string[]): string => {
  return `${baseUrl.replace(/\/$/, "")}/${parts.map((part) => encodeS3Path(part)).join("/")}`;
};

const uploadLocalImage = async (key: string, imageBuffer: Buffer): Promise<string> => {
  const uploadRoot = path.resolve(process.cwd(), env.LOCAL_UPLOAD_DIR);
  const targetPath = path.resolve(uploadRoot, key);

  if (!targetPath.startsWith(`${uploadRoot}${path.sep}`)) {
    throw new AppError(ErrorCode.InvalidUpload, {
      message: "Invalid upload path"
    });
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, imageBuffer);

  return buildPublicUrl(env.API_PUBLIC_URL, env.LOCAL_UPLOAD_PUBLIC_PATH.replace(/^\/+/, ""), key);
};

const formatAmzDate = (date: Date): { amzDate: string; dateStamp: string } => {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");

  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8)
  };
};

const signMinioRequest = (input: {
  method: "PUT";
  path: string;
  query?: string;
  body: Buffer | string;
  contentType?: string;
}): Headers => {
  const endpoint = new URL(env.MINIO_ENDPOINT);
  const { amzDate, dateStamp } = formatAmzDate(new Date());
  const bodyHash = sha256Hex(input.body);
  const headersToSign: Record<string, string> = {
    host: endpoint.host,
    "x-amz-content-sha256": bodyHash,
    "x-amz-date": amzDate
  };

  if (input.contentType) {
    headersToSign["content-type"] = input.contentType;
  }

  const signedHeaders = Object.keys(headersToSign).sort().join(";");
  const canonicalHeaders = Object.keys(headersToSign)
    .sort()
    .map((headerName) => `${headerName}:${headersToSign[headerName]}\n`)
    .join("");
  const canonicalRequest = [
    input.method,
    input.path,
    input.query ?? "",
    canonicalHeaders,
    signedHeaders,
    bodyHash
  ].join("\n");
  const credentialScope = `${dateStamp}/${env.MINIO_REGION}/${s3Service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const dateKey = hmac(`AWS4${env.MINIO_SECRET_KEY}`, dateStamp);
  const regionKey = hmac(dateKey, env.MINIO_REGION);
  const serviceKey = hmac(regionKey, s3Service);
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${env.MINIO_ACCESS_KEY}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`
  ].join(", ");
  const headers = new Headers();

  Object.entries(headersToSign).forEach(([name, value]) => headers.set(name, value));
  headers.set("authorization", authorization);

  return headers;
};

const putMinio = async (pathName: string, body: Buffer | string, contentType?: string): Promise<Response> => {
  const endpoint = new URL(env.MINIO_ENDPOINT);
  const pathNameWithSlash = pathName.startsWith("/") ? pathName : `/${pathName}`;
  const [pathnameOnly = "/", query = ""] = pathNameWithSlash.split("?");
  const headers = signMinioRequest({
    method: "PUT",
    path: pathnameOnly,
    query: query === "policy" ? "policy=" : query,
    body,
    contentType
  });

  return fetch(`${endpoint.origin}${pathNameWithSlash}`, {
    method: "PUT",
    headers,
    body
  });
};

const ensureMinioBucket = async (): Promise<void> => {
  const bucketPath = `/${encodeURIComponent(env.MINIO_BUCKET)}`;
  const createBucketResponse = await putMinio(bucketPath, "");

  if (!createBucketResponse.ok && createBucketResponse.status !== 409) {
    throw new AppError(ErrorCode.InvalidUpload, {
      message: "Unable to create upload bucket",
      details: {
        status: createBucketResponse.status
      }
    });
  }

  const policy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          AWS: ["*"]
        },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${env.MINIO_BUCKET}/*`]
      }
    ]
  });
  const policyResponse = await putMinio(`${bucketPath}?policy`, policy, "application/json");

  if (!policyResponse.ok) {
    throw new AppError(ErrorCode.InvalidUpload, {
      message: "Unable to configure upload bucket policy",
      details: {
        status: policyResponse.status
      }
    });
  }
};

const uploadMinioImage = async (
  key: string,
  imageBuffer: Buffer,
  contentType: UploadImageInput["contentType"]
): Promise<string> => {
  await ensureMinioBucket();

  const objectPath = `/${encodeURIComponent(env.MINIO_BUCKET)}/${encodeS3Path(key)}`;
  const response = await putMinio(objectPath, imageBuffer, contentType);

  if (!response.ok) {
    throw new AppError(ErrorCode.InvalidUpload, {
      message: "Unable to upload image",
      details: {
        status: response.status
      }
    });
  }

  return buildPublicUrl(env.MINIO_PUBLIC_URL, env.MINIO_BUCKET, key);
};

export const uploadMenuImage = async (
  tenantId: string,
  input: UploadImageInput,
  actorAdminId?: string
): Promise<UploadImageDto> => {
  const imageBuffer = decodeImage(input);
  const key = buildObjectKey(tenantId, input.fileName, input.contentType);
  const url =
    env.UPLOAD_STORAGE_PROVIDER === "minio"
      ? await uploadMinioImage(key, imageBuffer, input.contentType)
      : await uploadLocalImage(key, imageBuffer);
  await recordAuditLog({
    tenantId,
    actorAdminId,
    action: "MENU_IMAGE_UPLOADED",
    resourceType: "UPLOAD",
    resourceId: key,
    metadata: {
      contentType: input.contentType,
      sizeBytes: imageBuffer.length
    }
  });

  return {
    url,
    key,
    sizeBytes: imageBuffer.length
  };
};
