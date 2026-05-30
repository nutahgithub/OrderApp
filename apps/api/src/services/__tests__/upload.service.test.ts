import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { ErrorCode } from "../../shared/errors/error-catalog.js";
import { uploadMenuImage } from "../upload.service.js";
import { recordAuditLog } from "../audit-log.service.js";

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn(),
    writeFile: vi.fn()
  }
}));

vi.mock("../audit-log.service.js", () => ({
  recordAuditLog: vi.fn()
}));

const toBase64 = (buffer: Buffer): string => buffer.toString("base64");

const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const webpBuffer = Buffer.from([
  0x52,
  0x49,
  0x46,
  0x46,
  0x04,
  0x00,
  0x00,
  0x00,
  0x57,
  0x45,
  0x42,
  0x50
]);

describe("upload service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["image/jpeg", "photo.jpg", jpegBuffer, ".jpg"],
    ["image/png", "photo.png", pngBuffer, ".png"],
    ["image/webp", "photo.webp", webpBuffer, ".webp"]
  ] as const)("accepts a valid %s image by magic bytes", async (contentType, fileName, imageBuffer, extension) => {
    const result = await uploadMenuImage("tenant-1", {
      fileName,
      contentType,
      dataBase64: toBase64(imageBuffer)
    });

    expect(result.key).toMatch(new RegExp(`^tenants/tenant-1/menus/photo-[a-f0-9-]+\\${extension}$`));
    expect(result.url).toContain(result.key);
    expect(result.sizeBytes).toBe(imageBuffer.length);
    expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining(result.key.replace(/\//g, path.sep)), imageBuffer);
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        action: "MENU_IMAGE_UPLOADED",
        resourceType: "UPLOAD",
        resourceId: result.key,
        metadata: {
          contentType,
          sizeBytes: imageBuffer.length
        }
      })
    );
  });

  it("rejects a file whose declared content type does not match its magic bytes", async () => {
    await expect(
      uploadMenuImage("tenant-1", {
        fileName: "fake.png",
        contentType: "image/png",
        dataBase64: toBase64(jpegBuffer)
      })
    ).rejects.toMatchObject({
      code: ErrorCode.InvalidUpload,
      details: {
        declaredContentType: "image/png",
        detectedContentType: "image/jpeg"
      }
    });
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it("rejects files over the configured decoded size limit", async () => {
    const oversizedImage = Buffer.concat([jpegBuffer, Buffer.alloc(1_000_000)]);

    await expect(
      uploadMenuImage("tenant-1", {
        fileName: "large.jpg",
        contentType: "image/jpeg",
        dataBase64: toBase64(oversizedImage)
      })
    ).rejects.toMatchObject({
      code: ErrorCode.InvalidUpload,
      details: {
        maxImageBytes: 1_000_000,
        actualImageBytes: oversizedImage.length
      }
    });
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it("sanitizes tenant and file name segments before building the storage key", async () => {
    const result = await uploadMenuImage("../Tenant One", {
      fileName: "../Pho Bo../../evil.jpg",
      contentType: "image/jpeg",
      dataBase64: toBase64(jpegBuffer)
    });

    expect(result.key).toMatch(/^tenants\/tenant-one\/menus\/pho-bo-evil-[a-f0-9-]+\.jpg$/);
    expect(result.key).not.toContain("..");
    expect(result.key).not.toContain("\\");
  });
});
