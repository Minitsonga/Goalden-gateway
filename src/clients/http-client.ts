import { AppError } from "../errors/app-error.js";
import { createHttpMappedError } from "../errors/error-utils.js";

type JsonObject = Record<string, unknown>;

/**
 * Tente de parser le corps d'une réponse HTTP en JSON.
 * Retourne null si le corps est vide ou si le JSON est malformé,
 * évitant ainsi une exception non gérée lors de la lecture de réponses d'erreur.
 */
async function safeJsonParse(response: Response): Promise<JsonObject | null> {
  try {
    const payload = (await response.json()) as JsonObject;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Client HTTP générique utilisé par tous les clients de service (auth, team...).
 *
 * Encapsule un appel `fetch` vers un service interne et gère uniformément :
 * - La construction de l'URL (baseUrl + path)
 * - L'ajout du header Authorization si un token est fourni
 * - La sérialisation du body en JSON pour les requêtes POST
 * - Les erreurs réseau (service injoignable → AppError SERVICE_UNAVAILABLE 503)
 * - Les réponses HTTP d'erreur (4xx/5xx → AppError avec le code métier correspondant)
 *
 * Le type générique T permet à chaque client de typer précisément la réponse attendue.
 *
 * Exemple d'utilisation :
 *   const user = await httpRequest<MeResponse>({
 *     baseUrl: "http://localhost:3001",
 *     path: "/api/users/me",
 *     method: "GET",
 *     token: userJwt
 *   });
 */
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
    // Le service cible est injoignable (réseau, DNS, service down)
    throw new AppError({
      code: "SERVICE_UNAVAILABLE",
      statusCode: 503,
      message: "Service distant indisponible."
    });
  }

  const payload = await safeJsonParse(response);
  if (!response.ok) {
    // Le service a répondu mais avec un code d'erreur HTTP (4xx ou 5xx)
    // On traduit le status HTTP en AppError avec le code métier correspondant
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
