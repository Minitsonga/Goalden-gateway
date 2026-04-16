/**
 * Codes d'erreur métier utilisés dans tout le gateway.
 * Ces codes apparaissent dans le champ `extensions.code` des erreurs GraphQL
 * pour permettre aux clients de distinguer et gérer les cas d'erreur précis.
 *
 * VALIDATION_ERROR   : données invalides dans la requête (champ manquant, format incorrect)
 * UNAUTHORIZED       : aucun token fourni ou token invalide/expiré
 * FORBIDDEN          : token valide mais droits insuffisants sur la ressource
 * NOT_FOUND          : ressource demandée introuvable
 * CONFLICT           : conflit de données (ex. email déjà utilisé)
 * INTERNAL_ERROR     : erreur interne inattendue du serveur
 * SERVICE_UNAVAILABLE: un service interne est injoignable ou hors service
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

/**
 * Table de correspondance entre codes HTTP et codes d'erreur métier.
 * Utilisée par `createHttpMappedError` pour convertir une réponse HTTP d'erreur
 * d'un service interne en AppError avec le bon code métier.
 * Les codes HTTP non listés ici seront mappés sur "INTERNAL_ERROR" par défaut.
 */
export const HTTP_TO_CODE: Record<number, ErrorCode> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  500: "INTERNAL_ERROR",
  503: "SERVICE_UNAVAILABLE"
};
