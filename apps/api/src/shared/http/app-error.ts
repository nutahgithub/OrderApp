export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  public constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

