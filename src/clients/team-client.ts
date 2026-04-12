import { env } from "../config/env.js";
import { httpRequest } from "./http-client.js";

type TeamResponse = {
  id: string;
  name: string;
  role?: string;
};

export type Team = {
  id: string;
  name: string;
  role: string | null;
};

export interface TeamClient {
  getMyTeams(token: string): Promise<Team[]>;
}

export function createTeamClient(): TeamClient {
  return {
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
    }
  };
}
