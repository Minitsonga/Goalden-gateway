import { requireAuth } from "../auth/require-auth.js";
import { createAuthClient, type AuthClient } from "../clients/auth-client.js";
import { createTeamClient, type TeamClient } from "../clients/team-client.js";
import type { GatewayContext } from "../context.js";

export type ResolverDependencies = {
  authClient: AuthClient;
  teamClient: TeamClient;
};

export function createResolverDependencies(): ResolverDependencies {
  return {
    authClient: createAuthClient(),
    teamClient: createTeamClient()
  };
}

export function createResolvers(deps: ResolverDependencies) {
  return {
    Query: {
      health: () => ({
        status: "ok"
      }),
      me: async (_parent: unknown, _args: unknown, context: GatewayContext) => {
        const { token } = requireAuth(context);
        return deps.authClient.getMe(token);
      },
      myTeams: async (_parent: unknown, _args: unknown, context: GatewayContext) => {
        const { token } = requireAuth(context);
        return deps.teamClient.getMyTeams(token);
      }
    },
    Mutation: {
      logout: async (_parent: unknown, _args: unknown, context: GatewayContext) => {
        const { token } = requireAuth(context);
        return deps.authClient.logout(token);
      }
    }
  };
}
