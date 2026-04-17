import type { GenderDivision, SectionCategory } from "../constants/domain-enums.js";
import { isGenderDivision, isSectionCategory } from "../constants/domain-enums.js";
import { env } from "../config/env.js";
import { httpRequest } from "./http-client.js";

/** Format de réponse brut renvoyé par GET /api/me/teams sur le team-service. */
type TeamResponse = {
  _id?: string;
  id?: string;
  teamId?: string;
  name: string;
  teamName?: string;
  role?: string;
  roleInTeam?: string;
  genderDivision?: string;
  squadNumber?: number;
  sectionCategory?: string;
  sectionName?: string;
  sectionId?: string;
  clubId?: string;
  clubName?: string;
};

type ClubWire = {
  id?: string;
  _id?: string;
  name?: string;
  city?: string;
  sport?: string;
};

type CreateClubResponse = {
  data?: ClubWire;
  id?: string;
  _id?: string;
  name?: string;
  city?: string;
  sport?: string;
};

type CreateSectionResponse = {
  data?: { id?: string; _id?: string; name?: string; category?: string };
};

type CreateTeamResponse = {
  data?: {
    id?: string;
    _id?: string;
    name?: string;
    genderDivision?: string;
    squadNumber?: number;
  };
};

/** Club normalisé côté gateway (ville et sport toujours des chaînes, aligné GraphQL `Club`). */
export type Club = {
  id: string;
  name: string;
  city: string;
  sport: string;
};

function clubFromWire(
  row: ClubWire,
  fallback?: { name: string; city: string; sport: string }
): Club {
  return {
    id: String(row.id ?? row._id ?? ""),
    name: String(row.name ?? fallback?.name ?? ""),
    city: String(row.city ?? fallback?.city ?? ""),
    sport: String(row.sport ?? fallback?.sport ?? "")
  };
}

/** Format normalisé exposé par le gateway dans le type GraphQL Team. */
export type Team = {
  id: string;
  name: string;
  role: string | null; // null explicite plutôt qu'undefined pour GraphQL
  genderDivision: GenderDivision;
  squadNumber: number;
  sectionCategory: SectionCategory | null;
  sectionName: string | null;
  sectionId: string | null;
  clubId: string | null;
  clubName: string | null;
};

/**
 * Interface du client team-service.
 * Définie séparément pour permettre l'injection de mocks dans les tests.
 */
export interface TeamClient {
  getMyTeams(token: string): Promise<Team[]>;
  listClubs(token: string): Promise<Club[]>;
  createClub(token: string, params: { name: string; city: string; sport: string }): Promise<Club>;
  createSection(
    token: string,
    params: { clubId: string; name: string; category: SectionCategory }
  ): Promise<{ id: string; name: string; category: SectionCategory }>;
  createTeam(
    token: string,
    params: { sectionId: string; name: string; genderDivision: GenderDivision }
  ): Promise<{ id: string; name: string; genderDivision: GenderDivision; squadNumber: number }>;
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
     * Appelle GET /api/me/teams sur le team-service avec le JWT utilisateur.
     * Le team-service retourne uniquement les équipes avec un membership ACTIVE.
     * Utilisé par le resolver GraphQL `myTeams`.
     */
    async getMyTeams(token: string): Promise<Team[]> {
      const data = await httpRequest<{ success: boolean; data: TeamResponse[] }>({
        baseUrl: env.teamServiceUrl,
        path: "/api/me/teams",
        method: "GET",
        token
      });

      return (data.data ?? [])
        .map((row) => {
          const id = String(row.teamId ?? row.id ?? row._id ?? "");
          const name = String(row.teamName ?? row.name ?? "");
          const gdRaw = row.genderDivision ?? "";
          const sn = row.squadNumber;
          if (!id || !name || !isGenderDivision(gdRaw) || typeof sn !== "number") {
            return null;
          }
          const scRaw = row.sectionCategory;
          const sectionCategory =
            scRaw != null && isSectionCategory(scRaw) ? scRaw : null;
          return {
            id,
            name,
            role: row.roleInTeam ?? row.role ?? null,
            genderDivision: gdRaw,
            squadNumber: sn,
            sectionCategory,
            sectionName: row.sectionName ?? null,
            sectionId: row.sectionId != null ? String(row.sectionId) : null,
            clubId: row.clubId != null ? String(row.clubId) : null,
            clubName: row.clubName ?? null
          };
        })
        .filter((team): team is Team => team != null);
    },

    async listClubs(token: string): Promise<Club[]> {
      const data = await httpRequest<{ data?: ClubWire[] } | ClubWire[]>({
        baseUrl: env.teamServiceUrl,
        path: "/api/clubs",
        method: "GET",
        token
      });

      const clubs = Array.isArray(data) ? data : (data.data ?? []);
      return clubs
        .map((row) => clubFromWire(row))
        .filter((c) => Boolean(c.id) && Boolean(c.name) && Boolean(c.city) && Boolean(c.sport));
    },

    async createClub(token: string, params: { name: string; city: string; sport: string }): Promise<Club> {
      const data = await httpRequest<CreateClubResponse>({
        baseUrl: env.teamServiceUrl,
        path: "/api/clubs",
        method: "POST",
        token,
        body: {
          name: params.name,
          city: params.city,
          sport: params.sport
        }
      });

      const row: ClubWire =
        data.data ??
        ({
          id: data.id,
          _id: data._id,
          name: data.name,
          city: data.city,
          sport: data.sport
        } satisfies ClubWire);
      return clubFromWire(row, params);
    },

    async createSection(
      token: string,
      params: { clubId: string; name: string; category: SectionCategory }
    ): Promise<{ id: string; name: string; category: SectionCategory }> {
      const data = await httpRequest<CreateSectionResponse>({
        baseUrl: env.teamServiceUrl,
        path: `/api/clubs/${params.clubId}/sections`,
        method: "POST",
        token,
        body: {
          name: params.name,
          category: params.category
        }
      });

      const section = data.data ?? {};
      const rawCategory = section.category ?? params.category;
      const category = isSectionCategory(String(rawCategory))
        ? (rawCategory as SectionCategory)
        : params.category;
      return {
        id: String(section.id ?? section._id ?? ""),
        name: String(section.name ?? params.name),
        category
      };
    },

    async createTeam(
      token: string,
      params: { sectionId: string; name: string; genderDivision: GenderDivision }
    ): Promise<{ id: string; name: string; genderDivision: GenderDivision; squadNumber: number }> {
      const data = await httpRequest<CreateTeamResponse>({
        baseUrl: env.teamServiceUrl,
        path: `/api/sections/${params.sectionId}/teams`,
        method: "POST",
        token,
        body: {
          name: params.name,
          genderDivision: params.genderDivision
        }
      });

      const team = data.data ?? {};
      const rawGd = team.genderDivision ?? params.genderDivision;
      const genderDivision = isGenderDivision(String(rawGd)) ? (rawGd as GenderDivision) : params.genderDivision;
      if (typeof team.squadNumber !== "number") {
        throw new Error("[team-client] createTeam: réponse sans squadNumber numérique");
      }
      const squadNumber = team.squadNumber;
      return {
        id: String(team.id ?? team._id ?? ""),
        name: String(team.name ?? params.name),
        genderDivision,
        squadNumber
      };
    }
  };
}
