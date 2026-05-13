import type { Response } from "express";

export type ApiSuccessResponse<TData> = {
  data: TData;
  meta?: unknown;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export const ok = <TData>(response: Response, data: TData, meta?: unknown): void => {
  response.json({ data, ...(meta ? { meta } : {}) } satisfies ApiSuccessResponse<TData>);
};

export const created = <TData>(response: Response, data: TData, meta?: unknown): void => {
  response.status(201).json({ data, ...(meta ? { meta } : {}) } satisfies ApiSuccessResponse<TData>);
};

export const fail = (
  response: Response,
  statusCode: number,
  error: ApiErrorResponse["error"]
): void => {
  response.status(statusCode).json({ error } satisfies ApiErrorResponse);
};
