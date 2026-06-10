import { z } from "zod";
import { ApiError } from "./errors";

export async function validateBody<T extends z.ZodTypeAny>(request: Request, schema: T): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw ApiError.badRequest("Invalid JSON payload");
    }
    throw error;
  }
}

export function validateParams<T extends z.ZodTypeAny>(request: Request, schema: T): z.infer<T> {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  return schema.parse(params);
}
