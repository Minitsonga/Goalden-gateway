import { AppError } from "../errors/app-error.js";
import type { GatewayContext } from "../context.js";

export function requireAuth(context: GatewayContext): {
  userId: string;
  token: string;
} {
  if (context.authError) {
    throw context.authError;
  }

  if (!context.user || !context.token) {
    throw new AppError({
      code: "UNAUTHORIZED",
      statusCode: 401,
      message: "Authentification requise."
    });
  }

  return {
    userId: context.user.sub,
    token: context.token
  };
}
