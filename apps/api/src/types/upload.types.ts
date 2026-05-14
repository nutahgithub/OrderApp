export type UploadImageInput = {
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  dataBase64: string;
};

export type UploadImageDto = {
  url: string;
  key: string;
  sizeBytes: number;
};
