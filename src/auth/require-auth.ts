import { AppError } from "../errors/app-error.js";
import type { GatewayContext } from "../context.js";

/**
 * Garde d'authentification à appeler en tête de chaque resolver protégé.
 *
 * Elle inspecte le contexte GraphQL (construit à partir du header Authorization
 * de la requête HTTP) et lève une erreur si l'utilisateur n'est pas authentifié.
 *
 * Deux cas d'erreur possibles :
 * 1. Le token était présent mais invalide → context.authError contient l'AppError
 *    capturée lors de la vérification JWT (ex. token expiré, signature incorrecte).
 * 2. Aucun token fourni du tout → on lève une AppError UNAUTHORIZED générique.
 *
 * Si l'utilisateur est bien authentifié, retourne { userId, token } pour que
 * le resolver puisse les transmettre aux appels vers les services internes.
 */
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

  const userId = context.user.sub ?? context.user.userId;
  if (!userId) {
    throw new AppError({
      code: "UNAUTHORIZED",
      statusCode: 401,
      message: "JWT utilisateur invalide."
    });
  }

  return {
    userId,
    token: context.token
  };
}
