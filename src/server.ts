import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLError } from "graphql";
import type { IncomingMessage } from "node:http";
import { isIntrospectionEnabled, env } from "./config/env.js";
import { createContextFromAuthHeader, type GatewayContext } from "./context.js";
import { toAppError } from "./errors/error-utils.js";
import { createResolverDependencies, createResolvers, type ResolverDependencies } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/type-defs.js";

/**
 * Extrait la valeur du header Authorization depuis une requête HTTP Node.js.
 *
 * Le header peut théoriquement être un tableau de valeurs (norme HTTP/1.1),
 * mais en pratique Apollo Server reçoit toujours une seule valeur.
 * On prend le premier élément du tableau pour couvrir les deux cas.
 * Retourne undefined si le header est absent.
 */
function getAuthorizationHeader(req: IncomingMessage): string | undefined {
  const raw = req.headers.authorization;
  if (!raw) {
    return undefined;
  }
  return Array.isArray(raw) ? raw[0] : raw;
}

/**
 * Crée et configure l'instance Apollo Server.
 *
 * La factory accepte des dépendances injectées (`deps`) pour faciliter les tests :
 * en passant des clients mockés, on peut tester les resolvers sans services réels.
 * En production, `createResolverDependencies()` crée les clients HTTP réels.
 *
 * Configuration notable :
 * - `introspection` : activé en dev, désactivé en production (voir isIntrospectionEnabled)
 * - `formatError`   : normalise toutes les erreurs GraphQL au format AppError avant de
 *   les envoyer au client, ajoutant `extensions.code` et `extensions.statusCode`
 */
export function createApolloServer(deps: ResolverDependencies = createResolverDependencies()) {
  return new ApolloServer<GatewayContext>({
    typeDefs,
    resolvers: createResolvers(deps),
    introspection: isIntrospectionEnabled(),

    /**
     * Intercepte toutes les erreurs avant qu'elles soient sérialisées dans la réponse.
     * Convertit n'importe quelle erreur (AppError, GraphQLError, erreur inconnue)
     * en une réponse GraphQL structurée avec :
     * - extensions.code       : code métier (ex. "UNAUTHORIZED")
     * - extensions.statusCode : code HTTP équivalent (ex. 401)
     * - extensions.details    : données supplémentaires (ex. champs invalides)
     */
    formatError(formattedError, originalError) {
      const appError = toAppError(originalError);
      return new GraphQLError(appError.message, {
        path: formattedError.path,
        extensions: {
          code: appError.code,
          statusCode: appError.statusCode,
          details: appError.details ?? null
        }
      });
    }
  });
}

/**
 * Démarre le serveur Apollo Gateway en mode standalone.
 *
 * "Standalone" signifie qu'Apollo gère lui-même le serveur HTTP (pas besoin d'Express).
 * À chaque requête entrante, la fonction `context` est appelée pour construire
 * le contexte GraphQL : elle lit le header Authorization et tente de vérifier le JWT.
 * Ce contexte est ensuite disponible dans tous les resolvers via le 3ème argument.
 */
export async function startServer() {
  const server = createApolloServer();
  const { url } = await startStandaloneServer(server, {
    listen: { port: env.port },
    context: async ({ req }) => {
      const authorization = getAuthorizationHeader(req);
      return createContextFromAuthHeader(authorization);
    }
  });

  // eslint-disable-next-line no-console
  console.log(`API gateway running at ${url}`);
}
