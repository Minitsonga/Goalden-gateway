# Goalden API Gateway

Gateway GraphQL (Apollo Server v5 + TypeScript) pour exposer un point d'entree unique vers les microservices REST.

## Prerequis

- Node.js `>=20`
- Services REST accessibles (auth, team)

## Installation

```bash
npm install
```

## Variables d'environnement

| Variable | Defaut | Description |
|---|---|---|
| `PORT` | `3000` | Port HTTP de la gateway |
| `NODE_ENV` | `development` | Environnement (`production` desactive l'introspection par defaut) |
| `USER_JWT_SECRET` | _(obligatoire)_ | Secret de validation JWT utilisateur |
| `AUTH_SERVICE_URL` | `http://localhost:3001` | URL du auth-service |
| `TEAM_SERVICE_URL` | `http://localhost:3002` | URL du team-service |
| `ENABLE_GRAPHQL_INTROSPECTION` | auto | `true/false` pour forcer l'introspection |

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run test
```

## API GraphQL MVP

### Query

- `health`: endpoint public de sante
- `me`: profil utilisateur (JWT requis)
- `myTeams`: equipes de l'utilisateur (JWT requis)

### Mutation

- `logout`: cloture de session (JWT requis)

## Contrat d'erreur

Les erreurs sont normalisees avec:

- `extensions.code` (ex: `UNAUTHORIZED`, `VALIDATION_ERROR`)
- `extensions.statusCode`
- `extensions.details` (optionnel)

## Introspection

- Active par defaut hors production
- En production: desactivee sauf si `ENABLE_GRAPHQL_INTROSPECTION=true`
