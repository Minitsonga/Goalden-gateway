import { AppError } from "./app-error.js";
import { HTTP_TO_CODE } from "./error-codes.js";

/**
 * Convertit n'importe quel type d'erreur en AppError normalisée.
 *
 * Cette fonction est utilisée dans le `formatError` d'Apollo Server pour garantir
 * que toutes les erreurs remontées par les resolvers suivent le même format JSON.
 *
 * Trois cas sont gérés :
 * 1. L'erreur est déjà une AppError → retournée telle quelle
 * 2. L'erreur est une GraphQLError wrappant une AppError (ex. erreur levée dans un resolver
 *    et encapsulée par Apollo) → on déballage l'AppError depuis originalError
 * 3. Toute autre erreur inconnue (bug, exception non prévue) → AppError INTERNAL_ERROR 500
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "originalError" in error &&
    (error as { originalError?: unknown }).originalError instanceof AppError
  ) {
    return (error as { originalError: AppError }).originalError;
  }

  return new AppError({
    message: "Une erreur interne est survenue.",
    code: "INTERNAL_ERROR",
    statusCode: 500
  });
}

/**
 * Crée une AppError à partir d'une réponse HTTP d'erreur d'un service interne.
 *
 * Utilisée par `httpRequest` quand un service répond avec un status 4xx ou 5xx.
 * Traduit le code HTTP en code métier via la table HTTP_TO_CODE.
 * Si le code HTTP n'est pas dans la table, fallback sur "INTERNAL_ERROR".
 *
 * Exemple :
 *   auth-service répond 401 "Token expiré"
 *   → AppError { code: "UNAUTHORIZED", statusCode: 401, message: "Token expiré" }
 */
export function createHttpMappedError(params: {
  statusCode: number;
  message: string;
  details?: unknown;
}): AppError {
  const code = HTTP_TO_CODE[params.statusCode] ?? "INTERNAL_ERROR";
  return new AppError({
    message: params.message,
    code,
    statusCode: params.statusCode,
    details: params.details
  });
}
