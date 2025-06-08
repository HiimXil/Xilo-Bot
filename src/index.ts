import dotenv from "dotenv";
import { resolve } from "path";
import { prisma } from "./Utils/prisma";
import type { Configuration, State } from "./Utils/types";
import { AskQuestion, validAnswer } from "./Quiz/quiz";
import { client } from "./Utils/Client";
import { handleNonOfficialCommand } from "./Utils/nonOfficialCommand";
import CommandHandler from "./interfaces/CommandHandler";
import {
  checkWordle,
  createWordleChannel,
  ResetWordle,
  ChooseWordleWord,
} from "./Wordle/wordle";
import { Logger } from "./Utils/Logger";
import { epicFreeGames } from "./EpicGames/epicFreeGames";
import cron from "node-cron";

// Importation des commandes
import sugest_question from "./Commands/sugest_question";
import hint from "./Commands/hint";
import trigger from "./Commands/trigger";
import explain from "./Commands/explain";
import score from "./Commands/score";
import topscore from "./Commands/topscore";
import set_score from "./Commands/set_score";
import select_quiz_channel from "./Commands/select_quiz_channel";
import select_quiz_role from "./Commands/select_quiz_role";
import setup_wordle from "./Commands/setup_wordle";
import setup_freegame from "./Commands/setup_freegame";
import share_wordle from "./Commands/share_wordle";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

dotenv.config({ path: resolve(__dirname, "../.env") });

const commandHandler = new CommandHandler();
commandHandler.addCommand(sugest_question);
commandHandler.addCommand(hint);
commandHandler.addCommand(trigger);
commandHandler.addCommand(explain);
commandHandler.addCommand(score);
commandHandler.addCommand(topscore);
commandHandler.addCommand(set_score);
commandHandler.addCommand(select_quiz_channel);
commandHandler.addCommand(select_quiz_role);
commandHandler.addCommand(setup_wordle);
commandHandler.addCommand(setup_freegame);
commandHandler.addCommand(share_wordle);

// Demarrage du bot
client.once("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user?.tag}`);
  commandHandler.registerCommands(client);
  if (process.env.NODE_ENV !== "development") {
    AskQuestion(client);
    epicFreeGames();
    cron.schedule("0 9-23/2 * * *", () => {
      console.log("⏰ Exécution programmée de epicFreeGames");
      epicFreeGames();
    });
    cron.schedule("0 8 * * *", async () => {
      console.log("⏰ Exécution programmée du Wordle");
      const states = await prisma.state.findMany();
      for (const state of states) {
        ResetWordle(client.guilds.cache.get(state.guildId)!);
      }
      ChooseWordleWord();
    });
  } else {
    console.log("Mode développement, pas de question envoyée.");
    epicFreeGames();
  }
});

// Action autour des interactions
client.on("interactionCreate", async (interaction) => {
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "add_question") {
      const question = interaction.fields.getTextInputValue("question");
      const answer = interaction.fields.getTextInputValue("answer");
      const description = interaction.fields.getTextInputValue("description");

      if (!interaction.guild) {
        await interaction.reply({
          content: "❌ Cette commande ne peut pas être utilisée ici.",
          ephemeral: true,
        });
        return;
      }
      // Envoie la question dans un channel dédié
      await prisma.configuration
        .findFirst({
          where: { guildId: interaction.guild.id },
        })
        .then(async (conf: Configuration | null) => {
          if (!conf || !conf.quizSugestChannelId) {
            await interaction.reply({
              content: "❌ Le channel de suggestion n'est pas configuré.",
              ephemeral: true,
            });
            return;
          }
          const channel = client.channels.cache.get(conf.quizSugestChannelId);
          if (channel && channel.isTextBased() && "send" in channel) {
            const suggestQuestion = await prisma.suggestedQuestion.create({
              data: {
                text: question,
                answer,
                description,
                username: interaction.user.id,
              },
            });

            const bouton = new ButtonBuilder()
              .setCustomId("add_question_to_quiz:" + suggestQuestion.id)
              .setLabel("Ajouter au quiz")
              .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              bouton
            );

            await channel.send({
              content: `Nouvelle question proposée par <@${interaction.user.id}> :\n**Question** : ${question}\n**Réponse** : ${answer}\n**Description** : ${description}`,
              allowedMentions: { users: [] },
              components: [row],
            });
            await interaction.reply({
              content: "✅ Question proposée avec succès.",
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: "❌ Le channel de quiz n'est pas accessible.",
              ephemeral: true,
            });
          }
        });
    }
  }
  if (interaction.isButton()) {
    if (interaction.customId === "CreateChannelWordle") {
      createWordleChannel(interaction);
    }
    if (interaction.customId.startsWith("add_question_to_quiz:")) {
      const questionId = Number(interaction.customId.split(":")[1]);
      const question = await prisma.suggestedQuestion.findUnique({
        where: { id: questionId },
      });
      if (!question) {
        await interaction.reply({
          content: "❌ Question introuvable.",
          ephemeral: true,
        });
        return;
      }
      // Ajoute la question au quiz
      await prisma.question.create({
        data: {
          text: question.text,
          answer: question.answer,
          description: question.description,
        },
      });
      await interaction.reply({
        content: "✅ Question ajoutée au quiz avec succès.",
        ephemeral: true,
      });
    }
  }
  if (interaction.isChatInputCommand()) {
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
        content:
          "❌ Une erreur est survenue lors de l'exécution de la commande.",
        ephemeral: true,
      });
    }
  }
});

// Action autour des messages
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  await handleNonOfficialCommand(message);
  checkWordle(message);

  const state: State | null = await prisma.state.findFirst({
    where: { guildId: message.guild?.id },
  });
  // Vérifie réponse au quiz
  if (state?.currentAnswer && !state?.answered) {
    const parts = state?.currentAnswer!.split(/\s+/).map((part, i) => {
      // si la réponse est un nombre
      if (i === 0 && part.startsWith("-")) {
        const word = part.slice(1); // sans le -
        return `-\\b${word}\\b`;
      } else if (/^\d+(\.\d+)?$/.test(part)) {
        return `(?<!-)\\b${part}\\b`;
      }
      return `\\b${part}\\b`;
    });

    const pattern = parts.join("\\s+");
    const regex = new RegExp(pattern, "u");
    console.log(regex);
    if (regex.test(message.content.replace(",", "."))) {
      validAnswer(message, client);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
