import { env } from "../config/env.js";
import { httpRequest } from "./http-client.js";

/** Format de réponse brut renvoyé par GET /api/teams/my sur le team-service. */
type TeamResponse = {
  id: string;
  name: string;
  role?: string; // Le rôle peut être absent si l'utilisateur n'a pas de membership actif
};

type ClubResponse = {
  id?: string;
  _id?: string;
  name: string;
  city?: string;
};

type CreateClubResponse = {
  data?: ClubResponse;
  id?: string;
  _id?: string;
  name?: string;
  city?: string;
};

type CreateSectionResponse = {
  data?: { id?: string; _id?: string; name?: string; sport?: string };
};

type CreateTeamResponse = {
  data?: { id?: string; _id?: string; name?: string; category?: string; level?: string };
};

export type Club = {
  id: string;
  name: string;
  city: string | null;
};

/** Format normalisé exposé par le gateway dans le type GraphQL Team. */
export type Team = {
  id: string;
  name: string;
  role: string | null; // null explicite plutôt qu'undefined pour GraphQL
};

/**
 * Interface du client team-service.
 * Définie séparément pour permettre l'injection de mocks dans les tests.
 */
export interface TeamClient {
  getMyTeams(token: string): Promise<Team[]>;
  listClubs(token: string): Promise<Club[]>;
  createClub(token: string, params: { name: string; city?: string }): Promise<Club>;
  createSection(
    token: string,
    params: { clubId: string; name: string; sport: string }
  ): Promise<{ id: string; name: string; sport: string | null }>;
  createTeam(
    token: string,
    params: { sectionId: string; name: string; category: string; level: string }
  ): Promise<{ id: string; name: string; category: string | null; level: string | null }>;
}

/**
 * Crée et retourne un client pour communiquer avec le team-service.
 *
 * Comme pour l'auth-client, le JWT utilisateur est transmis tel quel :
 * c'est le team-service qui vérifie l'identité et filtre les équipes
 * selon les memberships actifs de l'utilisateur.
 */
export function createTeamClient(): TeamClient {
  return {
    /**
     * Récupère la liste des équipes dont l'utilisateur est membre.
     * Appelle GET /api/teams/my sur le team-service avec le JWT utilisateur.
     * Le team-service retourne uniquement les équipes avec un membership ACTIVE.
     * Utilisé par le resolver GraphQL `myTeams`.
     */
    async getMyTeams(token: string): Promise<Team[]> {
      const data = await httpRequest<{ teams: TeamResponse[] }>({
        baseUrl: env.teamServiceUrl,
        path: "/api/teams/my",
        method: "GET",
        token
      });

      return data.teams.map((team) => ({
        id: team.id,
        name: team.name,
        role: team.role ?? null
      }));
    },

    async listClubs(token: string): Promise<Club[]> {
      const data = await httpRequest<{ data?: ClubResponse[] } | ClubResponse[]>({
        baseUrl: env.teamServiceUrl,
        path: "/api/clubs",
        method: "GET",
        token
      });

      const clubs = Array.isArray(data) ? data : (data.data ?? []);
      return clubs.map((club) => ({
        id: String(club.id ?? club._id ?? ""),
        name: club.name,
        city: club.city ?? null
      }));
    },

    async createClub(token: string, params: { name: string; city?: string }): Promise<Club> {
      const data = await httpRequest<CreateClubResponse>({
        baseUrl: env.teamServiceUrl,
        path: "/api/clubs",
        method: "POST",
        token,
        body: {
          name: params.name,
          city: params.city
        }
      });

      const club = data.data ?? data;
      return {
        id: String(club.id ?? club._id ?? ""),
        name: String(club.name ?? params.name),
        city: (club.city as string | undefined) ?? params.city ?? null
      };
    },

    async createSection(
      token: string,
      params: { clubId: string; name: string; sport: string }
    ): Promise<{ id: string; name: string; sport: string | null }> {
      const data = await httpRequest<CreateSectionResponse>({
        baseUrl: env.teamServiceUrl,
        path: `/api/clubs/${params.clubId}/sections`,
        method: "POST",
        token,
        body: {
          name: params.name,
          sport: params.sport
        }
      });

      const section = data.data ?? {};
      return {
        id: String(section.id ?? section._id ?? ""),
        name: String(section.name ?? params.name),
        sport: (section.sport as string | undefined) ?? params.sport ?? null
      };
    },

    async createTeam(
      token: string,
      params: { sectionId: string; name: string; category: string; level: string }
    ): Promise<{ id: string; name: string; category: string | null; level: string | null }> {
      const data = await httpRequest<CreateTeamResponse>({
        baseUrl: env.teamServiceUrl,
        path: `/api/sections/${params.sectionId}/teams`,
        method: "POST",
        token,
        body: {
          name: params.name,
          category: params.category,
          level: params.level
        }
      });

      const team = data.data ?? {};
      return {
        id: String(team.id ?? team._id ?? ""),
        name: String(team.name ?? params.name),
        category: (team.category as string | undefined) ?? params.category ?? null,
        level: (team.level as string | undefined) ?? params.level ?? null
      };
    }
  };
}
