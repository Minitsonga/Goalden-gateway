import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it } from "vitest";
import { env } from "./config/env.js";
import { createContextFromAuthHeader } from "./context.js";
import { createApolloServer } from "./server.js";

const TEST_USER_ID = "user-123";

function createAuthHeader() {
  const token = jwt.sign({ sub: TEST_USER_ID, email: "ju@example.com" }, env.userJwtSecret);
  return `Bearer ${token}`;
}

afterEach(() => {
  delete process.env.ENABLE_GRAPHQL_INTROSPECTION;
});

describe("Gateway protected operations", () => {
  it("rejects protected query when no token is provided", async () => {
    const server = createApolloServer({
      authClient: {
        getMe: async () => ({ id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }),
        logout: async () => true,
        register: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        login: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        refresh: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        getServiceToken: async () => "service-token"
      },
      teamClient: {
        getMyTeams: async () => [{ id: "t1", name: "Team 1", role: "COACH" }],
        listClubs: async () => [{ id: "c1", name: "Club 1", city: "Paris" }],
        createClub: async () => ({ id: "c1", name: "Club 1", city: "Paris" }),
        createSection: async () => ({ id: "s1", name: "Section 1", sport: "Football" }),
        createTeam: async () => ({ id: "t1", name: "Team 1", category: "Senior", level: "Regional" })
      },
      notificationClient: {
        sendEmail: async () => true
      }
    });

    const result = await server.executeOperation(
      { query: "query { me { id email } }" },
      { contextValue: createContextFromAuthHeader(undefined) }
    );

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors?.[0]?.extensions?.code).toBe("UNAUTHORIZED");
    }
  });

  it("rejects protected query when token is invalid", async () => {
    const server = createApolloServer({
      authClient: {
        getMe: async () => ({ id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }),
        logout: async () => true,
        register: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        login: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        refresh: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        getServiceToken: async () => "service-token"
      },
      teamClient: {
        getMyTeams: async () => [{ id: "t1", name: "Team 1", role: "COACH" }],
        listClubs: async () => [{ id: "c1", name: "Club 1", city: "Paris" }],
        createClub: async () => ({ id: "c1", name: "Club 1", city: "Paris" }),
        createSection: async () => ({ id: "s1", name: "Section 1", sport: "Football" }),
        createTeam: async () => ({ id: "t1", name: "Team 1", category: "Senior", level: "Regional" })
      },
      notificationClient: {
        sendEmail: async () => true
      }
    });

    const result = await server.executeOperation(
      { query: "query { me { id email } }" },
      { contextValue: createContextFromAuthHeader("Bearer invalid-token") }
    );

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors?.[0]?.extensions?.code).toBe("UNAUTHORIZED");
    }
  });

  it("resolves protected query when token is valid", async () => {
    const server = createApolloServer({
      authClient: {
        getMe: async () => ({
          id: TEST_USER_ID,
          email: "ju@example.com",
          displayName: "Ju"
        }),
        logout: async () => true,
        register: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        login: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        refresh: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        getServiceToken: async () => "service-token"
      },
      teamClient: {
        getMyTeams: async () => [{ id: "t1", name: "Team 1", role: "COACH" }],
        listClubs: async () => [{ id: "c1", name: "Club 1", city: "Paris" }],
        createClub: async () => ({ id: "c1", name: "Club 1", city: "Paris" }),
        createSection: async () => ({ id: "s1", name: "Section 1", sport: "Football" }),
        createTeam: async () => ({ id: "t1", name: "Team 1", category: "Senior", level: "Regional" })
      },
      notificationClient: {
        sendEmail: async () => true
      }
    });

    const result = await server.executeOperation(
      { query: "query { me { id email displayName } }" },
      { contextValue: createContextFromAuthHeader(createAuthHeader()) }
    );

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data).toEqual({
        me: {
          id: TEST_USER_ID,
          email: "ju@example.com",
          displayName: "Ju"
        }
      });
    }
  });
});

describe("Gateway schema introspection policy", () => {
  it("disables introspection when env flag is false", async () => {
    process.env.ENABLE_GRAPHQL_INTROSPECTION = "false";

    const server = createApolloServer({
      authClient: {
        getMe: async () => ({ id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }),
        logout: async () => true,
        register: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        login: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        refresh: async () => ({
          accessToken: "access",
          refreshToken: "refresh",
          user: { id: TEST_USER_ID, email: "ju@example.com", displayName: "Ju" }
        }),
        getServiceToken: async () => "service-token"
      },
      teamClient: {
        getMyTeams: async () => [{ id: "t1", name: "Team 1", role: "COACH" }],
        listClubs: async () => [{ id: "c1", name: "Club 1", city: "Paris" }],
        createClub: async () => ({ id: "c1", name: "Club 1", city: "Paris" }),
        createSection: async () => ({ id: "s1", name: "Section 1", sport: "Football" }),
        createTeam: async () => ({ id: "t1", name: "Team 1", category: "Senior", level: "Regional" })
      },
      notificationClient: {
        sendEmail: async () => true
      }
    });

    const result = await server.executeOperation({
      query: "query { __schema { queryType { name } } }"
    });

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors?.[0]?.extensions?.code).toBe("INTERNAL_ERROR");
      expect(result.body.singleResult.data).toBeUndefined();
    }
  });
});
