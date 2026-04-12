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
  }

  type Mutation {
    """
    Termine la session de l'utilisateur courant.
    Requiert un JWT utilisateur valide.
    """
    logout: Boolean!
  }
`;
