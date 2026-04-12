import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

export type UserClaims = {
  sub: string;
  email?: string;
  roles?: string[];
};

export function verifyUserToken(token: string): UserClaims {
  try {
    const decoded = jwt.verify(token, env.userJwtSecret);
    if (!decoded || typeof decoded !== "object" || typeof decoded.sub !== "string") {
      throw new Error("Invalid token payload");
    }
    return decoded as UserClaims;
  } catch {
    throw new AppError({
      code: "UNAUTHORIZED",
      statusCode: 401,
      message: "JWT utilisateur invalide."
    });
  }
}

export function extractBearerToken(rawHeader: string | undefined): string | null {
  if (!rawHeader) {
    return null;
  }

  const [scheme, token] = rawHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}
