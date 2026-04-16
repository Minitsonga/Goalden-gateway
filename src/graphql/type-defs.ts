export const typeDefs = `#graphql
  """
  Etat de disponibilite de la gateway.
  """
  type HealthStatus {
    """
    Indique si la gateway est disponible.
    """
    status: String!
  }

  """
  Utilisateur authentifie.
  """
  type User {
    """
    Identifiant unique utilisateur.
    """
    id: ID!
    """
    Email principal.
    """
    email: String!
    """
    Nom a afficher dans les clients.
    """
    displayName: String
  }

  """
  Equipe contextualisee pour l'utilisateur.
  """
  type Team {
    """
    Identifiant unique d'equipe.
    """
    id: ID!
    """
    Nom de l'equipe.
    """
    name: String!
    """
    Role utilisateur dans cette equipe.
    """
    role: String
  }

  """
  Club sportif.
  """
  type Club {
    id: ID!
    name: String!
    city: String
  }

  """
  Section (sport) appartenant a un club.
  """
  type Section {
    id: ID!
    name: String!
    sport: String
  }

  """
  Donnees d'authentification renvoyees apres login/register/refresh.
  """
  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  input RegisterInput {
    email: String!
    password: String!
    displayName: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RefreshInput {
    refreshToken: String!
  }

  input CreateClubInput {
    name: String!
    city: String
  }

  input CreateSectionInput {
    clubId: ID!
    name: String!
    sport: String!
  }

  input CreateTeamInput {
    sectionId: ID!
    name: String!
    category: String!
    level: String!
  }

  input SendEmailInput {
    to: String!
    subject: String!
    text: String!
  }

  type Query {
    """
    Endpoint public de sante.
    """
    health: HealthStatus!

    """
    Retourne le profil de l'utilisateur connecte.
    Requiert un JWT utilisateur valide.
    """
    me: User!

    """
    Retourne les equipes de l'utilisateur connecte.
    Requiert un JWT utilisateur valide.
    """
    myTeams: [Team!]!

    """
    Liste les clubs visibles pour l'utilisateur connecte.
    Requiert un JWT utilisateur valide.
    """
    clubs: [Club!]!
  }

  type Mutation {
    """
    Termine la session de l'utilisateur courant.
    Requiert un JWT utilisateur valide.
    """
    logout: Boolean!

    """
    Inscription via l'auth-service, exposee via la gateway.
    """
    register(input: RegisterInput!): AuthPayload!

    """
    Connexion via l'auth-service, exposee via la gateway.
    """
    login(input: LoginInput!): AuthPayload!

    """
    Renouvelle un accessToken a partir d'un refreshToken.
    """
    refresh(input: RefreshInput!): AuthPayload!

    """
    Cree un club via le team-service.
    """
    createClub(input: CreateClubInput!): Club!

    """
    Cree une section dans un club via le team-service.
    """
    createSection(input: CreateSectionInput!): Section!

    """
    Cree une equipe dans une section via le team-service.
    """
    createTeam(input: CreateTeamInput!): Team!

    """
    Envoie un email interne via le notification-service.
    La gateway agit comme service M2M.
    """
    sendDemoEmail(input: SendEmailInput!): Boolean!
  }
`;
