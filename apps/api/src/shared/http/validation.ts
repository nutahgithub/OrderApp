import type { Request } from "express";
import type { z } from "zod";

export const parseBody = <TSchema extends z.ZodType>(request: Request, schema: TSchema): z.infer<TSchema> => {
  return schema.parse(request.body);
};

export const parseParams = <TSchema extends z.ZodType>(request: Request, schema: TSchema): z.infer<TSchema> => {
  return schema.parse(request.params);
};

export const parseQuery = <TSchema extends z.ZodType>(request: Request, schema: TSchema): z.infer<TSchema> => {
  return schema.parse(request.query);
};
