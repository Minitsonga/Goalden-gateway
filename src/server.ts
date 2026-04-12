import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLError } from "graphql";
import type { IncomingMessage } from "node:http";
import { isIntrospectionEnabled, env } from "./config/env.js";
import { createContextFromAuthHeader, type GatewayContext } from "./context.js";
import { toAppError } from "./errors/error-utils.js";
import { createResolverDependencies, createResolvers, type ResolverDependencies } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/type-defs.js";

function getAuthorizationHeader(req: IncomingMessage): string | undefined {
  const raw = req.headers.authorization;
  if (!raw) {
    return undefined;
  }
  return Array.isArray(raw) ? raw[0] : raw;
}

export function createApolloServer(deps: ResolverDependencies = createResolverDependencies()) {
  return new ApolloServer<GatewayContext>({
    typeDefs,
    resolvers: createResolvers(deps),
    introspection: isIntrospectionEnabled(),
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
