import dotenv from "dotenv";
import { startServer } from "./server.js";

dotenv.config();

// Point d'entrée du gateway.
// Lance le serveur Apollo et commence à écouter les requêtes GraphQL entrantes.
// `void` indique intentionnellement que la Promise n'est pas attendue ici :
// les erreurs de démarrage sont gérées à l'intérieur de startServer().
void startServer();
