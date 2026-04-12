import { AppError } from "./app-error.js";
import { HTTP_TO_CODE } from "./error-codes.js";

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "originalError" in error &&
    (error as { originalError?: unknown }).originalError instanceof AppError
  ) {
    return (error as { originalError: AppError }).originalError;
  }

  return new AppError({
    message: "Une erreur interne est survenue.",
    code: "INTERNAL_ERROR",
    statusCode: 500
  });
}

export function createHttpMappedError(params: {
  statusCode: number;
  message: string;
  details?: unknown;
}): AppError {
  const code = HTTP_TO_CODE[params.statusCode] ?? "INTERNAL_ERROR";
  return new AppError({
    message: params.message,
    code,
    statusCode: params.statusCode,
    details: params.details
  });
}
