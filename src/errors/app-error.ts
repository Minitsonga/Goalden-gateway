import type { ErrorCode } from "./error-codes.js";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(params: {
    message: string;
    code: ErrorCode;
    statusCode: number;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.details = params.details;
  }
}
