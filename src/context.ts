import { extractBearerToken, verifyUserToken, type UserClaims } from "./auth/jwt.js";
import { AppError } from "./errors/app-error.js";

/**
 * Contexte GraphQL attaché à chaque requête entrante.
 * Il est construit une seule fois par requête (dans la fonction `context` d'Apollo Server)
 * et injecté dans chaque resolver via le 3ème argument.
 *
 * - token     : le JWT brut extrait du header Authorization (ou null si absent)
 * - user      : le payload décodé du JWT si la vérification a réussi (ou null)
 * - authError : l'erreur capturée si le JWT était présent mais invalide (ou null)
 *
 * Le fait de stocker authError plutôt que de lancer l'exception immédiatement
 * permet aux resolvers publics (ex. `health`) de fonctionner même avec un
 * token invalide — seuls les resolvers protégés appellent requireAuth() qui,
 * lui, relancera l'erreur.
 */
export type GatewayContext = {
  token: string | null;
  user: UserClaims | null;
  authError: AppError | null;
};

/**
 * Construit le contexte GraphQL à partir du header Authorization HTTP.
 *
 * Cette fonction est appelée par Apollo Server avant chaque résolution de requête.
 * Elle suit la logique suivante :
 *
 * 1. Pas de header Authorization → contexte anonyme (token=null, user=null, authError=null)
 *    Les resolvers publics fonctionneront ; les resolvers protégés lèveront UNAUTHORIZED.
 *
 * 2. Header présent avec token valide → contexte authentifié (token=<jwt>, user=<claims>)
 *    Les resolvers protégés auront accès à userId et au token pour appeler les services.
 *
 * 3. Header présent mais token invalide → contexte avec erreur (user=null, authError=<AppError>)
 *    L'erreur est mémorisée pour être relancée par requireAuth() dans les resolvers protégés.
 */
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
