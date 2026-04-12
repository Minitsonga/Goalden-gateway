import { extractBearerToken, verifyUserToken, type UserClaims } from "./auth/jwt.js";
import { AppError } from "./errors/app-error.js";

export type GatewayContext = {
  token: string | null;
  user: UserClaims | null;
  authError: AppError | null;
};

export function createContextFromAuthHeader(
  authorizationHeader: string | undefined
): GatewayContext {
  const token = extractBearerToken(authorizationHeader);
  if (!token) {
    return {
      token: null,
      user: null,
      authError: null
    };
  }

  try {
    const user = verifyUserToken(token);
    return {
      token,
      user,
      authError: null
    };
  } catch (error) {
    return {
      token,
      user: null,
      authError: error instanceof AppError ? error : null
    };
  }
}
