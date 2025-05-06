import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("set_score")
    .setDescription("Initialise le score d'un utilisateur")
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur dont tu veux voir le score")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("score")
        .setDescription("Le score de l'utilisateur")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("score")
    .setDescription("Affiche ton score ou celui d'un autre membre")
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur dont tu veux voir le score")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("topscore")
    .setDescription("Affiche les meilleurs scores du serveur"),
  new SlashCommandBuilder()
    .setName("select_quiz_channel")
    .setDescription("Sélectionne le salon où le quiz sera joué"),
  new SlashCommandBuilder()
    .setName("select_quiz_role")
    .setDescription("Sélectionne le rôle qui sera ping pour jouer au quiz")
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("le rôle qui sera ping pour jouer au quiz")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("hint")
    .setDescription("Donne un indice pour trouver la réponse à la question"),
  new SlashCommandBuilder()
    .setName("trigger")
    .setDescription("Déclenche le quiz dans le salon sélectionné"),
  new SlashCommandBuilder()
    .setName("explain")
    .setDescription("Explique la réponse à la question actuelle"),
  new SlashCommandBuilder()
    .setName("add_question")
    .setDescription("Permet d'ajouter une question au quiz")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("La question à ajouter")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("réponse")
        .setDescription("La réponse à la question")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("La description de la question")
        .setRequired(false)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log("🔁 Enregistrement des commandes slash...");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: commands,
    });

    console.log("✅ Commandes enregistrées avec succès.");
  } catch (error) {
    console.error("Erreur lors de l’enregistrement des commandes :", error);
  }
})();
