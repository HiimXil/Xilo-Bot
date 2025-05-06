import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { resolve } from "path";
import { prisma } from "./Utils/prisma";
import type { User, Configuration, State } from "./Quiz/types";
import { AskQuestion, CreateHint, validAnswer, timeouts } from "./Quiz/quiz";

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
  if (!interaction.guild) {
    await interaction.reply({
      content: "❌ Cette commande ne peut pas être utilisée ici.",
      ephemeral: true,
    });
    return;
  }

  // /score
  if (interaction.commandName === "score") {
    const targetUser =
      interaction.options.getUser("utilisateur") || interaction.user;
    const discordId = targetUser.id;

    const user = await prisma.user.findUnique({
      where: {
        guildId_discordId: { discordId, guildId: interaction.guild?.id },
      },
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
      where: { guildId: guild.id },
    });
    if (GuildId) {
      await prisma.configuration.update({
        where: { guildId: guild.id },
        data: { quizChannelId: channel.id },
      });
    } else {
      await prisma.configuration.create({
        data: {
          guildId: guild.id,
          quizChannelId: channel.id,
        },
      });
    }
    await interaction.reply({
      content: `✅ Salon sélectionné`,
      ephemeral: true,
    });
  }

  // /set_score
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
      where: {
        guildId_discordId: { guildId: interaction.guild?.id, discordId },
      },
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
  // /select_quiz_role
  if (interaction.commandName === "select_quiz_role") {
    const role = interaction.options.getRole("role");
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: "❌ Cette commande ne peut pas être utilisée ici.",
        ephemeral: true,
      });
      return;
    }
    if (!role) {
      await interaction.reply({
        content: "❌ Veuillez sélectionner un rôle.",
        ephemeral: true,
      });
      return;
    }
    const GuildId = await prisma.configuration.findUnique({
      where: { guildId: guild.id },
    });
    if (GuildId) {
      await prisma.configuration.update({
        where: { guildId: guild.id },
        data: { quizRoleId: role.id },
      });
    } else {
      await interaction.reply({
        content: `❌ Veuillez d'abord sélectionner un salon.`,
        ephemeral: true,
      });
    }
    await interaction.reply({
      content: `✅ Rôle sélectionné`,
      ephemeral: true,
    });
  }

  // /hint
  if (interaction.commandName === "hint") {
    const state: State | null = await prisma.state.findFirst({
      where: { guildId: interaction.guild?.id },
    });
    if (!state) {
      await interaction.reply({
        content: "❌ Aucune question en cours.",
        ephemeral: true,
      });
      return;
    }
    if (state.answered === true) {
      await interaction.reply({
        content: "❌ Aucune question en cours.",
        ephemeral: true,
      });
      return;
    }
    const hint = CreateHint(state.currentAnswer);
    await interaction.reply({
      content: `💡 Indice : ${hint}`,
      ephemeral: false,
    });
  }

  // /trigger
  if (interaction.commandName === "trigger") {
    const state: State | null = await prisma.state.findFirst({
      where: { guildId: interaction.guild?.id },
    });
    if (state?.answered === false) {
      await interaction.reply({
        content: "❌ Une question est déjà en cours.",
        ephemeral: true,
      });
      return;
    }
    if (timeouts[interaction.guild?.id]) {
      clearTimeout(timeouts[interaction.guild.id]!);
    }
    AskQuestion(client);
    await interaction.reply({
      content: "✅ Question envoyée.",
      ephemeral: true,
    });
  }

  // /explain
  if (interaction.commandName === "explain") {
    const state: State | null = await prisma.state.findFirst({
      where: { guildId: interaction.guild?.id },
    });
    if (!state) {
      await interaction.reply({
        content: "❌ Aucune question en cours.",
        ephemeral: true,
      });
      return;
    }
    if (state.answered === false) {
      await interaction.reply({
        content: "❌ Faut répondre avant :)",
        ephemeral: true,
      });
      return;
    }
    const question = await prisma.question.findFirst({
      where: { text: state.currentQuestion ?? "" },
    });
    if (!question) {
      await interaction.reply({
        content: "❌ Aucune question trouvée.",
        ephemeral: true,
      });
      return;
    }
    await interaction.reply({
      content: `📖 Explication : ${question.description}`,
      ephemeral: false,
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
