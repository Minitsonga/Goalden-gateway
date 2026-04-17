export const typeDefs = `#graphql
  """
  Niveau / categorie de jeu de la section (liste fermee, alignee team-service).
  """
  enum SectionCategory {
    U8
    U11
    U13
    U15
    U18
    SENIOR
    LOISIR
  }

  """
  Division masculine / feminine / mixte (compteur d'equipe separe par division).
  """
  enum GenderDivision {
    MASCULIN
    FEMININ
    MIXTE
  }

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
    genderDivision: GenderDivision!
    squadNumber: Int!
    sectionCategory: SectionCategory
    sectionName: String
    sectionId: ID
    clubId: ID
    clubName: String
  }

  """
  Club sportif.
  """
  type Club {
    id: ID!
    name: String!
    city: String!
    sport: String!
  }

  """
  Section appartenant a un club (0..n). Le sport est porte par le club.
  """
  type Section {
    id: ID!
    name: String!
    category: SectionCategory!
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
  input RegisterWithInvitationInput {
    email: String!
    password: String!
    displayName: String!
    invitationCode: String!
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
    city: String!
    sport: String!
  }

  input CreateSectionInput {
    clubId: ID!
    name: String!
    category: SectionCategory!
  }

  input CreateTeamInput {
    sectionId: ID!
    name: String!
    genderDivision: GenderDivision!
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
    registerWithInvitation(input: RegisterWithInvitationInput!): AuthPayload!

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
