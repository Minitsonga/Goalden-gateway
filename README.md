# Gateway Service

Point d'entree GraphQL unique de Goalden. Il orchestre les appels REST vers les microservices metier.

## Ce que le service fait

- Expose les operations GraphQL publiques et authentifiees.
- Verifie le JWT utilisateur dans le contexte GraphQL.
- Relaye les appels vers `auth-service`, `team-service` et `notification-service`.
- Normalise les erreurs techniques/metier dans un format GraphQL coherent.

## Schema fonctionnel (MVP)

### Queries

- `health` (public)
- `me` (profil utilisateur)
- `myTeams` (equipes de l'utilisateur)
- `clubs` (liste des clubs)

### Mutations

- `register`, `registerWithInvitation`, `login`, `refresh`, `logout`
- `createClub`, `createSection`, `createTeam`
- `sendDemoEmail` (envoi interne via notification-service)

## Interactions avec les autres services

### Sortantes (gateway -> autres)

- `auth-service`
  - `/api/auth/*` et `/api/users/me`
  - `/internal/service-token` (pour obtenir un JWT service avant appel notification).
- `team-service`
  - `/api/me/teams`, `/api/clubs`, creation club/section/team.
- `notification-service`
  - `/internal/send-email` (avec JWT service).

### Entrantes (autres -> gateway)

- Le front et les clients externes consomment uniquement ce service en GraphQL.

## Stack technique

- Apollo Server v5 + TypeScript.
- Clients HTTP REST internes (`auth-client`, `team-client`, `notification-client`).
- JWT utilisateur + credentials M2M (`GATEWAY_SERVICE_ID` / `GATEWAY_SERVICE_SECRET`).

## Demarrage local

```bash
npm install
cp .env.example .env
npm run dev
```

Variables importantes: `USER_JWT_SECRET`, `AUTH_SERVICE_URL`, `TEAM_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `GATEWAY_SERVICE_ID`, `GATEWAY_SERVICE_SECRET`.
