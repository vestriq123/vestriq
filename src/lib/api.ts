import { NextResponse } from "next/server";
import { ApiError } from "./errors";
import { logger } from "./logger";
import { ZodError } from "zod";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    code?: number;
    details?: unknown;
  };
}

export function successResponse<T>(data: T, message?: string, status: number = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(message: string, code: number = 500, details?: unknown) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status: code }
  );
}

type NextRouteHandler = (request: Request, context?: unknown) => Promise<NextResponse> | NextResponse;

export function apiHandler(handler: NextRouteHandler): NextRouteHandler {
  return async (request: Request, context?: unknown) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        logger.warn(`API Warn [${request.method} ${request.url}]: ${error.message}`, { statusCode: error.statusCode });
        return errorResponse(error.message, error.statusCode, error.errors);
      }

      if (error instanceof ZodError) {
        logger.warn(`Validation Error [${request.method} ${request.url}]`, { errors: error.issues as unknown as Record<string, unknown> });
        return errorResponse("Validation failed", 400, error.issues.map(issue => ({
          field: issue.path.join("."),
          message: issue.message
        })));
      }

      const err = error as Error;
      logger.error(`API Exception [${request.method} ${request.url}]`, err);
      return errorResponse("An unexpected server error occurred", 500);
    }
  };
}
