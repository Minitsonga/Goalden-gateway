import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

/**
 * Structure des données contenues dans un JWT utilisateur.
 * Ces champs sont encodés dans le token par l'auth-service au moment de la connexion.
 * - sub  : identifiant unique de l'utilisateur (userId)
 * - email : email de l'utilisateur (optionnel selon la version du token)
 * - roles : rôles éventuels (non utilisé pour l'instant dans le gateway)
 */
export type UserClaims = {
  sub?: string;
  userId?: string;
  email?: string;
  roles?: string[];
};

/**
 * Vérifie la signature d'un JWT utilisateur et retourne son contenu décodé.
 *
 * La clé de vérification (USER_JWT_SECRET) est la même que celle utilisée
 * par l'auth-service pour signer le token. Si les deux clés ne correspondent pas,
 * la vérification échoue.
 *
 * Lève une AppError UNAUTHORIZED (401) dans deux cas :
 * - le token est expiré ou sa signature est invalide
 * - le payload décodé ne contient pas de champ `sub` (= pas d'userId)
 */
export function verifyUserToken(token: string): UserClaims {
  try {
    const decoded = jwt.verify(token, env.userJwtSecret);
    if (!decoded || typeof decoded !== "object") {
      throw new Error("Invalid token payload");
    }
    const normalized = decoded as UserClaims;
    const resolvedUserId = normalized.sub ?? normalized.userId;
    if (!resolvedUserId || typeof resolvedUserId !== "string") {
      throw new Error("Invalid token payload");
    }
    return {
      ...normalized,
      sub: resolvedUserId
    };
  } catch {
    throw new AppError({
      code: "UNAUTHORIZED",
      statusCode: 401,
      message: "JWT utilisateur invalide."
    });
  }
}

/**
 * Extrait le token brut depuis le header HTTP Authorization.
 *
 * Le header doit avoir la forme : "Bearer <token>"
 * Retourne null si le header est absent, mal formé, ou si le schéma n'est pas "Bearer".
 *
 * Exemples :
 *   "Bearer eyJhbGci..."  → retourne "eyJhbGci..."
 *   "Basic dXNlcjpwYXNz" → retourne null (mauvais schéma)
 *   undefined             → retourne null (header absent)
 */
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
