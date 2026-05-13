import type { Response } from "express";

export type ApiSuccessResponse<TData> = {
  data: TData;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export const ok = <TData>(response: Response, data: TData): void => {
  response.json({ data } satisfies ApiSuccessResponse<TData>);
};

export const created = <TData>(response: Response, data: TData): void => {
  response.status(201).json({ data } satisfies ApiSuccessResponse<TData>);
};

export const fail = (
  response: Response,
  statusCode: number,
  error: ApiErrorResponse["error"]
): void => {
  response.status(statusCode).json({ error } satisfies ApiErrorResponse);
};

