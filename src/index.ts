import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { generateMathQuestion } from "./mathQuestion";

const prisma = new PrismaClient();

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let currentQuestion: string | null = null;
let currentAnswer: string | null = null;
let answered = false;

// Demarrage du bot
client.once("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user?.tag}`);
  AskQuestion();
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
      orderBy: { score: "desc" },
      take: 5,
    });

    if (top.length === 0) {
      await interaction.reply("Aucun score enregistré pour l'instant !");
      return;
    }

    const topMessage = top
      .map(
        (user, index) =>
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
});

// Action autour des messages
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    message.reply("Pong !");
    return;
  }

  // Vérifie réponse au quiz
  if (
    currentAnswer &&
    message.content.toLowerCase().replace(",", ".") === currentAnswer &&
    !answered
  ) {
    answered = true;
    message.reply(
      `🎉 Bonne réponse <@${message.author.id}> ! Tu gagnes 1 point.`
    );

    const discordId = message.author.id;
    const username = message.author.username;

    await prisma.user.upsert({
      where: { discordId },
      update: {
        score: { increment: 1 },
        username,
      },
      create: {
        discordId,
        username,
        score: 1,
      },
    });

    //Réinitialise la question
    currentQuestion = null;
    currentAnswer = null;
    answered = false;

    // Envoie la prochaine question
    // Si l'heure actuelle est entre 21h et 9h, attend jusqu'à 9h
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 21 || currentHour < 9) {
      const nextQuestionTime = new Date();
      nextQuestionTime.setHours(9, 0, 0, 0); // 8h du matin
      const waitTime = nextQuestionTime.getTime() - now.getTime();
      console.log(
        "Attendre jusqu'à 9h du matin avant la prochaine question..."
      );
      setTimeout(() => {
        AskQuestion();
      }, waitTime);
      return;
    }
    // Sinon, attend entre 30 minutes et 1 heure
    const waitTime =
      Math.floor(Math.random() * (90 * 60 * 1000 - 60 * 60 * 1000 + 1)) +
      60 * 60 * 1000;
    console.log(
      "Attendre entre 30 minutes et une heure avant la prochaine question..."
    );
    setTimeout(() => {
      AskQuestion();
    }, waitTime);
  }
});

client.login(process.env.DISCORD_TOKEN);

async function AskQuestion() {
  let questionText = "";
  let answerText = "";
  answered = false;
  console.log("Nouvelle question...");
  // 70%/30% chance question de base ou math
  if (Math.random() < 0.7) {
    console.log("Question de la base de données");
    const count = await prisma.question.count();
    const rand = Math.floor(Math.random() * count);
    const question = await prisma.question.findFirst({
      skip: rand,
    });

    if (!question) return;
    questionText = question.text;
    answerText = question.answer.toLowerCase();
  } else {
    console.log("Question mathématique");
    const math = generateMathQuestion();
    questionText = math.question;
    answerText = math.answer.toLowerCase();
  }
  console.log("Question : ", questionText);
  console.log("Réponse : ", answerText);

  currentQuestion = questionText;
  currentAnswer = answerText;

  // Envoie la question dans le salon
  const channel = client.channels.cache.get(process.env.QUIZ_CHANNEL_ID!);
  if (channel && channel.isTextBased() && "send" in channel) {
    channel.send(`❓ **Question** : ${currentQuestion}`);
  }
}
