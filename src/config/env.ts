import dotenv from "dotenv";

// Charge .env avant toute lecture de process.env (important en ESM).
dotenv.config();

/**
 * Convertit une variable d'environnement texte en nombre.
 * Si la valeur est absente ou non parseable, retourne la valeur par défaut.
 * Exemple : PORT="3000" → 3000 ; PORT="abc" → fallback
 */
function asNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Convertit une variable d'environnement texte en booléen.
 * Accepte les valeurs "truthy" : "1", "true", "yes", "on"
 * Accepte les valeurs "falsy"  : "0", "false", "no", "off"
 * Toute autre valeur retourne la valeur par défaut.
 */
function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

/**
 * Configuration centralisée du gateway, lue depuis les variables d'environnement.
 *
 * - nodeEnv        : mode d'exécution ("development" | "production" | "test")
 * - port           : port d'écoute du serveur GraphQL (défaut : 3000)
 * - userJwtSecret  : clé secrète partagée avec l'auth-service pour vérifier les JWT utilisateurs
 * - authServiceUrl : URL de base de l'auth-service (pour les appels REST internes)
 * - teamServiceUrl : URL de base du team-service (pour les appels REST internes)
 */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: asNumber(process.env.PORT, 3000),
  userJwtSecret:
    process.env.USER_JWT_SECRET ??
    // Secret par défaut uniquement pour les tests (Vitest) afin d'éviter d'exiger
    // une variable d'environnement dans la CI locale.
    ((process.env.NODE_ENV ?? "development") === "test" ? "test-user-jwt-secret" : ""),
  authServiceUrl: process.env.AUTH_SERVICE_URL ?? "http://localhost:3001",
  teamServiceUrl: process.env.TEAM_SERVICE_URL ?? "http://localhost:3002",
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:3006",
  /**
   * Identité M2M utilisée par la gateway quand elle doit appeler des endpoints internes
   * (ex: notification-service). La gateway échange ces credentials contre un serviceJWT
   * auprès de l'auth-service via POST /internal/service-token.
   */
  gatewayServiceId: process.env.GATEWAY_SERVICE_ID ?? "gateway",
  gatewayServiceSecret:
    process.env.GATEWAY_SERVICE_SECRET ??
    ((process.env.NODE_ENV ?? "development") === "test" ? "test-gateway-service-secret" : "")
};

/**
 * Indique si l'introspection GraphQL est activée.
 *
 * L'introspection permet aux clients (ex. GraphQL Playground, Postman) d'explorer
 * le schéma GraphQL disponible. Elle est utile en développement mais doit être
 * désactivée en production pour ne pas exposer la structure de l'API.
 *
 * Comportement par défaut :
 * - activée si NODE_ENV !== "production"
 * - peut être forcée via la variable ENABLE_GRAPHQL_INTROSPECTION=true|false
 */
export function isIntrospectionEnabled(): boolean {
  const defaultForEnv = env.nodeEnv !== "production";
  return parseBool(process.env.ENABLE_GRAPHQL_INTROSPECTION, defaultForEnv);
}
