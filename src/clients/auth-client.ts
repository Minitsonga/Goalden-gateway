import { env } from "../config/env.js";
import { httpRequest } from "./http-client.js";

type MeResponse = {
  id: string;
  email: string;
  displayName?: string;
};

export type GatewayUser = {
  id: string;
  email: string;
  displayName: string | null;
};

type LogoutResponse = {
  success: boolean;
};

export interface AuthClient {
  getMe(token: string): Promise<GatewayUser>;
  logout(token: string): Promise<boolean>;
}

export function createAuthClient(): AuthClient {
  return {
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
    async logout(token: string): Promise<boolean> {
      const data = await httpRequest<LogoutResponse>({
        baseUrl: env.authServiceUrl,
        path: "/api/auth/logout",
        method: "POST",
        token
      });
      return Boolean(data.success);
    }
  };
}
