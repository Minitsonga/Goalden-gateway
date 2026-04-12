import { AppError } from "../errors/app-error.js";
import { createHttpMappedError } from "../errors/error-utils.js";

type JsonObject = Record<string, unknown>;

async function safeJsonParse(response: Response): Promise<JsonObject | null> {
  try {
    const payload = (await response.json()) as JsonObject;
    return payload;
  } catch {
    return null;
  }
}

export async function httpRequest<T>(params: {
  baseUrl: string;
  path: string;
  method?: "GET" | "POST";
  token?: string;
  body?: JsonObject;
}): Promise<T> {
  const method = params.method ?? "GET";
  const target = new URL(params.path, params.baseUrl);
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (params.token) {
    headers.Authorization = `Bearer ${params.token}`;
  }

  let response: Response;
  try {
    response = await fetch(target, {
      method,
      headers,
      body: params.body ? JSON.stringify(params.body) : undefined
    });
  } catch {
    throw new AppError({
      code: "SERVICE_UNAVAILABLE",
      statusCode: 503,
      message: "Service distant indisponible."
    });
  }

  const payload = await safeJsonParse(response);
  if (!response.ok) {
    throw createHttpMappedError({
      statusCode: response.status,
      message:
        typeof payload?.message === "string"
          ? payload.message
          : `Erreur distante (${response.status}).`,
      details: payload?.details
    });
  }

  return payload as unknown as T;
}
