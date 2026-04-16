import type { ErrorCode } from "./error-codes.js";

/**
 * Classe d'erreur métier du gateway.
 *
 * Toutes les erreurs prévisibles (token invalide, service indisponible,
 * ressource introuvable…) sont représentées par cette classe plutôt que
 * par des erreurs JavaScript génériques. Cela permet à `formatError` dans
 * Apollo Server de produire une réponse GraphQL structurée et cohérente.
 *
 * Chaque AppError porte :
 * - message    : texte lisible par un humain (affiché dans la réponse GraphQL)
 * - code       : code métier normalisé (ex. "UNAUTHORIZED", "NOT_FOUND") — voir ErrorCode
 * - statusCode : code HTTP équivalent (utile pour les logs et le mapping d'erreurs)
 * - details    : données supplémentaires optionnelles (ex. champs de validation en erreur)
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(params: {
    message: string;
    code: ErrorCode;
    statusCode: number;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.details = params.details;
  }
}
