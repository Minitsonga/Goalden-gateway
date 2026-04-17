import { requireAuth } from "../auth/require-auth.js";
import { createAuthClient, type AuthClient } from "../clients/auth-client.js";
import { createNotificationClient, type NotificationClient } from "../clients/notification-client.js";
import { createTeamClient, type TeamClient } from "../clients/team-client.js";
import type { GenderDivision, SectionCategory } from "../constants/domain-enums.js";
import { env } from "../config/env.js";
import type { GatewayContext } from "../context.js";
import { AppError } from "../errors/app-error.js";

/**
 * Dépendances injectées dans les resolvers.
 * Séparer les clients des resolvers permet de les remplacer par des mocks
 * dans les tests d'intégration sans démarrer de vrais services.
 */
export type ResolverDependencies = {
  authClient: AuthClient;
  teamClient: TeamClient;
  notificationClient: NotificationClient;
};

/**
 * Crée les dépendances réelles utilisées en production.
 * Chaque client est instancié ici et partagé entre tous les resolvers.
 */
export function createResolverDependencies(): ResolverDependencies {
  return {
    authClient: createAuthClient(),
    teamClient: createTeamClient(),
    notificationClient: createNotificationClient()
  };
}

/**
 * Crée et retourne l'objet resolvers GraphQL injecté dans Apollo Server.
 *
 * Les resolvers sont les fonctions qui répondent aux queries et mutations GraphQL.
 * Chaque resolver reçoit : (parent, args, context)
 * - parent  : résultat du resolver parent (non utilisé ici)
 * - args    : arguments passés dans la query/mutation (non utilisés ici)
 * - context : contexte de la requête (token JWT et user décodé)
 *
 * Pattern utilisé : les clients (authClient, teamClient) sont injectés via `deps`
 * pour découpler la logique métier des appels HTTP réels.
 */
export function createResolvers(deps: ResolverDependencies) {
  return {
    Query: {
      /**
       * Query publique : retourne simplement { status: "ok" }.
       * Permet de vérifier que le gateway est démarré et répond,
       * sans avoir besoin d'un token. Utile pour les health checks de l'infra.
       */
      health: () => ({
        status: "ok"
      }),

      /**
       * Query protégée : retourne le profil de l'utilisateur connecté.
       * Délègue à l'auth-service via GET /api/users/me.
       * requireAuth() garantit qu'un JWT valide est présent avant l'appel.
       */
      me: async (_parent: unknown, _args: unknown, context: GatewayContext) => {
        const { token } = requireAuth(context);
        return deps.authClient.getMe(token);
      },

      /**
       * Query protégée : retourne la liste des équipes de l'utilisateur connecté.
       * Délègue au team-service via GET /api/teams/my.
       * Seules les équipes avec un membership ACTIVE sont retournées.
       */
      myTeams: async (_parent: unknown, _args: unknown, context: GatewayContext) => {
        const { token } = requireAuth(context);
        return deps.teamClient.getMyTeams(token);
      },

      clubs: async (_parent: unknown, _args: unknown, context: GatewayContext) => {
        const { token } = requireAuth(context);
        return deps.teamClient.listClubs(token);
      }
    },
    Mutation: {
      /**
       * Mutation protégée : déconnecte l'utilisateur.
       * Délègue à l'auth-service via POST /api/auth/logout.
       * L'auth-service invalide le refresh token en base pour empêcher son réemploi.
       * Retourne true si la déconnexion a réussi.
       */
      logout: async (_parent: unknown, _args: unknown, context: GatewayContext) => {
        const { token } = requireAuth(context);
        return deps.authClient.logout(token);
      },

      register: async (
        _parent: unknown,
        args: { input: { email: string; password: string; displayName: string } },
        _context: GatewayContext
      ) => {
        return deps.authClient.register(args.input);
      },

      registerWithInvitation: async (
        _parent: unknown,
        args: { input: { email: string; password: string; displayName: string; invitationCode: string } },
        _context: GatewayContext
      ) => {
        return deps.authClient.registerWithInvitation(args.input);
      },

      login: async (
        _parent: unknown,
        args: { input: { email: string; password: string } },
        _context: GatewayContext
      ) => {
        return deps.authClient.login(args.input);
      },

      refresh: async (
        _parent: unknown,
        args: { input: { refreshToken: string } },
        _context: GatewayContext
      ) => {
        return deps.authClient.refresh(args.input);
      },

      createClub: async (
        _parent: unknown,
        args: { input: { name: string; city: string; sport: string } },
        context: GatewayContext
      ) => {
        const { token } = requireAuth(context);
        return deps.teamClient.createClub(token, args.input);
      },

      createSection: async (
        _parent: unknown,
        args: { input: { clubId: string; name: string; category: SectionCategory } },
        context: GatewayContext
      ) => {
        const { token } = requireAuth(context);
        return deps.teamClient.createSection(token, args.input);
      },

      createTeam: async (
        _parent: unknown,
        args: { input: { sectionId: string; name: string; genderDivision: GenderDivision } },
        context: GatewayContext
      ) => {
        const { token } = requireAuth(context);
        const created = await deps.teamClient.createTeam(token, args.input);
        return {
          id: created.id,
          name: created.name,
          role: null,
          genderDivision: created.genderDivision,
          squadNumber: created.squadNumber,
          sectionCategory: null,
          sectionName: null,
          sectionId: null,
          clubId: null,
          clubName: null
        };
      },

      sendDemoEmail: async (
        _parent: unknown,
        args: { input: { to: string; subject: string; text: string } },
        context: GatewayContext
      ) => {
        requireAuth(context);
        if (!env.gatewayServiceSecret) {
          throw new AppError({
            code: "VALIDATION_ERROR",
            statusCode: 400,
            message: "Configuration manquante: GATEWAY_SERVICE_SECRET."
          });
        }
        const serviceToken = await deps.authClient.getServiceToken({
          serviceId: env.gatewayServiceId,
          serviceSecret: env.gatewayServiceSecret
        });
        return deps.notificationClient.sendEmail({
          serviceToken,
          to: args.input.to,
          subject: args.input.subject,
          text: args.input.text
        });
      }
    }
  };
}
