function asNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: asNumber(process.env.PORT, 3000),
  userJwtSecret: process.env.USER_JWT_SECRET ?? "dev-user-jwt-secret",
  authServiceUrl: process.env.AUTH_SERVICE_URL ?? "http://localhost:3001",
  teamServiceUrl: process.env.TEAM_SERVICE_URL ?? "http://localhost:3002"
};

export function isIntrospectionEnabled(): boolean {
  const defaultForEnv = env.nodeEnv !== "production";
  return parseBool(process.env.ENABLE_GRAPHQL_INTROSPECTION, defaultForEnv);
}
