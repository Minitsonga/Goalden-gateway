import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { httpRequest } from "./http-client.js";

/** Format de réponse brut renvoyé par GET /api/users/me sur l'auth-service. */
type MeResponse = {
  id: string;
  email: string;
  displayName?: string;
};

type AuthUserResponse = {
  id: string;
  email: string;
  displayName?: string;
};

type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
};

/** Format normalisé exposé par le gateway dans le type GraphQL User. */
export type GatewayUser = {
  id: string;
  email: string;
  displayName: string | null; // null explicite plutôt qu'undefined pour GraphQL
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  user: GatewayUser;
};

/** Format de réponse brut renvoyé par POST /api/auth/logout sur l'auth-service. */
type LogoutResponse = {
  success: boolean;
};

type ServiceTokenResponse = {
  token?: string;
  accessToken?: string;
  serviceToken?: string;
};

/**
 * Interface du client auth-service.
 * Définie séparément de l'implémentation pour faciliter les tests :
 * on peut injecter un mock sans dépendre du vrai service.
 */
export interface AuthClient {
  getMe(token: string): Promise<GatewayUser>;
  logout(token: string): Promise<boolean>;
  register(params: { email: string; password: string; displayName: string }): Promise<AuthTokens>;
  registerWithInvitation(params: {
    email: string;
    password: string;
    displayName: string;
    invitationCode: string;
  }): Promise<AuthTokens>;
  login(params: { email: string; password: string }): Promise<AuthTokens>;
  refresh(params: { refreshToken: string }): Promise<AuthTokens>;
  getServiceToken(params: { serviceId: string; serviceSecret: string }): Promise<string>;
}

/**
 * Crée et retourne un client pour communiquer avec l'auth-service.
 *
 * Toutes les requêtes transmettent le JWT utilisateur reçu par le gateway —
 * c'est l'auth-service qui valide à nouveau ce token côté serveur.
 * Le gateway ne stocke aucune donnée utilisateur : il relaie et normalise.
 */
export function createAuthClient(): AuthClient {
  return {
    /**
     * Récupère le profil de l'utilisateur connecté.
     * Appelle GET /api/users/me sur l'auth-service avec le JWT utilisateur.
     * Utilisé par le resolver GraphQL `me`.
     */
    async getMe(token: string): Promise<GatewayUser> {
      const data = await httpRequest<MeResponse>({
        baseUrl: env.authServiceUrl,
        path: "/api/users/me",
        method: "GET",
        token
      });

      return {
        id: data.id,
        email: data.email,
        displayName: data.displayName ?? null
      };
    },

    /**
     * Déconnecte l'utilisateur en invalidant son refresh token côté auth-service.
     * Appelle POST /api/auth/logout avec le JWT utilisateur.
     * Utilisé par la mutation GraphQL `logout`.
     */
    async logout(token: string): Promise<boolean> {
      const data = await httpRequest<LogoutResponse>({
        baseUrl: env.authServiceUrl,
        path: "/api/auth/logout",
        method: "POST",
        token
      });
      return Boolean(data.success);
    },

    async register(params: {
      email: string;
      password: string;
      displayName: string;
    }): Promise<AuthTokens> {
      const data = await httpRequest<AuthTokensResponse>({
        baseUrl: env.authServiceUrl,
        path: "/api/auth/register",
        method: "POST",
        body: {
          email: params.email,
          password: params.password,
          displayName: params.displayName
        }
      });

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.displayName ?? null
        }
      };
    },

    async login(params: { email: string; password: string }): Promise<AuthTokens> {
      const data = await httpRequest<AuthTokensResponse>({
        baseUrl: env.authServiceUrl,
        path: "/api/auth/login",
        method: "POST",
        body: {
          email: params.email,
          password: params.password
        }
      });

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.displayName ?? null
        }
      };
    },

    async registerWithInvitation(params: {
      email: string;
      password: string;
      displayName: string;
      invitationCode: string;
    }): Promise<AuthTokens> {
      const data = await httpRequest<AuthTokensResponse>({
        baseUrl: env.authServiceUrl,
        path: "/api/auth/register-with-invitation",
        method: "POST",
        body: {
          email: params.email,
          password: params.password,
          displayName: params.displayName,
          invitationCode: params.invitationCode
        }
      });

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.displayName ?? null
        }
      };
    },

    async refresh(params: { refreshToken: string }): Promise<AuthTokens> {
      const data = await httpRequest<AuthTokensResponse>({
        baseUrl: env.authServiceUrl,
        path: "/api/auth/refresh",
        method: "POST",
        body: {
          refreshToken: params.refreshToken
        }
      });

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.displayName ?? null
        }
      };
    },

    async getServiceToken(params: {
      serviceId: string;
      serviceSecret: string;
    }): Promise<string> {
      const data = await httpRequest<ServiceTokenResponse>({
        baseUrl: env.authServiceUrl,
        path: "/internal/service-token",
        method: "POST",
        body: {
          serviceId: params.serviceId,
          serviceSecret: params.serviceSecret
        }
      });

      const token = data.token ?? data.accessToken ?? data.serviceToken;
      if (!token) {
        throw new AppError({
          code: "SERVICE_UNAVAILABLE",
          statusCode: 503,
          message: "Auth service token response does not contain a token"
        });
      }
      return String(token);
    }
  };
}
