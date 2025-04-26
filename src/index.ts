import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import type { User, Configuration } from "./Quiz/types";
import { AskQuestion, validAnswer } from "./Quiz/quiz";

const prisma = new PrismaClient();

dotenv.config({ path: resolve(__dirname, "../.env") });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Demarrage du bot
client.once("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user?.tag}`);
  AskQuestion(client);
});

// Commandes Slash
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // /score
  if (interaction.commandName === "score") {
    const targetUser =
      interaction.options.getUser("utilisateur") || interaction.user;
    const discordId = targetUser.id;

    const user = await prisma.user.findUnique({
      where: { discordId },
    });

    const score = user?.score ?? 0;

    await interaction.reply({
      content: `🏆 <@${targetUser.id}> a **${score} point${
        score !== 1 ? "s" : ""
      }**.`,
      allowedMentions: { users: [] }, // disables the ping
    });
  }

  // /topscore
  if (interaction.commandName === "topscore") {
    const top = await prisma.user.findMany({
      where: { guildId: interaction.guild?.id },
      orderBy: { score: "desc" },
      take: 5,
    });

    if (top.length === 0) {
      await interaction.reply("Aucun score enregistré pour l'instant !");
      return;
    }

    const topMessage = top
      .map(
        (user: User, index: number) =>
          `**${index + 1}.** <@${user.discordId}> — ${user.score} pts`
      )
      .join("\n");

    await interaction.reply({
      content: `🏆 **Top 5 des scores** :\n\n${topMessage}`,
      allowedMentions: { users: [] }, // disables the ping
    });
  }

  // /add_question
  if (interaction.commandName === "add_question") {
    const question = interaction.options.getString("question");
    const answer = interaction.options.getString("réponse");
    let description = interaction.options.getString("description");
    if (!question || !answer) {
      await interaction.reply({
        content: "❌ Question et réponse sont obligatoires.",
        ephemeral: true,
      });
      return;
    }
    await prisma.question.create({
      data: {
        text: question,
        answer,
        description: description ?? "",
      },
    });
    await interaction.reply({
      content: `✅ Question ajoutée :\n**Question** : ${question}\n**Réponse** : ${answer}`,
      ephemeral: true,
    });
  }

  // /select_quiz_channel
  if (interaction.commandName === "select_quiz_channel") {
    const channel = interaction.channel;
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: "❌ Cette commande ne peut pas être utilisée ici.",
        ephemeral: true,
      });
      return;
    }
    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        content: "❌ Veuillez sélectionner un salon texte.",
        ephemeral: true,
      });
      return;
    }
    const GuildId = await prisma.configuration.findUnique({
      where: { GuildId: guild.id },
    });
    if (GuildId) {
      await prisma.configuration.update({
        where: { GuildId: guild.id },
        data: { QuizChannelId: channel.id },
      });
    } else {
      await prisma.configuration.create({
        data: {
          GuildId: guild.id,
          QuizChannelId: channel.id,
        },
      });
    }
    await interaction.reply({
      content: `✅ Salon sélectionné`,
      ephemeral: true,
    });
  }

  if (interaction.commandName === "set_score") {
    const targetUser =
      interaction.options.getUser("utilisateur") || interaction.user;
    const discordId = targetUser.id;
    const score = interaction.options.getInteger("score");

    if (score === null) {
      await interaction.reply({
        content: "❌ Le score doit être un nombre.",
        ephemeral: true,
      });
      return;
    }

    await prisma.user.upsert({
      where: { discordId },
      update: { score },
      create: {
        discordId,
        username: targetUser.username,
        score,
        guildId: interaction.guild?.id,
      },
    });

    await interaction.reply({
      content: `✅ Score de <@${targetUser.id}> mis à jour : ${score} points.`,
      ephemeral: true,
    });
  }
});

// Action autour des messages
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    message.reply("Pong !");
    return;
  }

  const config: Configuration | null = await prisma.configuration.findFirst({
    where: { GuildId: message.guild?.id },
  });
  // Vérifie réponse au quiz
  if (
    config?.CurrentAnswer &&
    message.content.toLowerCase().replace(",", ".") === config.CurrentAnswer &&
    !config?.Answered
  ) {
    validAnswer(message, client);
  }
});

client.login(process.env.DISCORD_TOKEN);
