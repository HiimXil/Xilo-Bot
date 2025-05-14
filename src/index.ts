import dotenv from "dotenv";
import { resolve } from "path";
import { prisma } from "./Utils/prisma";
import type { Configuration, State } from "./Utils/types";
import { AskQuestion, validAnswer } from "./Quiz/quiz";
import { client } from "./Utils/Client";
import CommandHandler from "./interfaces/CommandHandler";
import { createWordleChannel, deleteWordleChannel } from "./Wordle/wordle";

// Importation des commandes
import add_question from "./Commands/add_question";
import hint from "./Commands/hint";
import trigger from "./Commands/trigger";
import explain from "./Commands/explain";
import score from "./Commands/score";
import topscore from "./Commands/topscore";
import set_score from "./Commands/set_score";
import select_quiz_channel from "./Commands/select_quiz_channel";
import select_quiz_role from "./Commands/select_quiz_role";
import setup_wordle from "./Commands/setup_wordle";
import { Logger } from "./Utils/Logger";

dotenv.config({ path: resolve(__dirname, "../.env") });

const commandHandler = new CommandHandler();
commandHandler.addCommand(add_question);
commandHandler.addCommand(hint);
commandHandler.addCommand(trigger);
commandHandler.addCommand(explain);
commandHandler.addCommand(score);
commandHandler.addCommand(topscore);
commandHandler.addCommand(set_score);
commandHandler.addCommand(select_quiz_channel);
commandHandler.addCommand(select_quiz_role);
commandHandler.addCommand(setup_wordle);

// Demarrage du bot
client.once("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user?.tag}`);
  commandHandler.registerCommands(client);
  if (process.env.NODE_ENV !== "development") {
    AskQuestion(client);
  }
});

// Action autour des interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commandHandler.getCommand(interaction.commandName);
  if (!command) {
    await interaction.reply({
      content: "❌ Commande introuvable.",
      ephemeral: true,
    });
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Erreur lors de l'exécution de la commande : ", error);
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'exécution de la commande.",
      ephemeral: true,
    });
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  // Si la réaction est partielle, on la récupère
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      Logger.error("Erreur lors du fetch de la réaction : " + error);
      return;
    }
  }
  createWordleChannel(reaction, user);
});

// Action autour des messages
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    message.reply("Pong !");
    return;
  }

  if (message.content === "!clear") {
    // Supprime tous les salons de Wordle
    deleteWordleChannel(message.guild!);
  }

  const state: State | null = await prisma.state.findFirst({
    where: { guildId: message.guild?.id },
  });
  // Vérifie réponse au quiz
  if (
    state?.currentAnswer &&
    message.content
      .toLowerCase()
      .replace(",", ".")
      .includes(state.currentAnswer) &&
    !state?.answered
  ) {
    validAnswer(message, client);
  }
});

client.login(process.env.DISCORD_TOKEN);
