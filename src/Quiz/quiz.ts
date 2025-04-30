import { PrismaClient } from "@prisma/client";
import { generateMathQuestion } from "./mathQuestion";
import { Configuration } from "./types";
import { Message, Client } from "discord.js";

const prisma = new PrismaClient();

// Génération de la question
async function generateQuestion(): Promise<string[] | undefined> {
  let questionText: string = "";
  let answerText: string = "";
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
  return [questionText, answerText];
}

// Sauvegarde la question et envoie la question dans le salon
export async function AskQuestion(client: Client) {
  await prisma.configuration
    .findMany()
    .then(async (config: Configuration[]) => {
      if (!config) {
        console.log("Aucun salon configuré pour le quiz.");
        return;
      }
      config.forEach(async (conf: Configuration) => {
        if (!conf.QuizChannelId) {
          console.log("Aucun salon configuré pour le quiz.");
          return;
        }
        if (
          conf.CurrentQuestion === null ||
          conf.CurrentQuestion === "" ||
          conf.Answered
        ) {
          const result = await generateQuestion();
          if (!result) {
            console.log("Failed to generate a question.");
            return;
          }
          const [questionText, answerText] = result;
          console.log("Update de la question pour la guilde : ", conf.GuildId);
          await prisma.configuration.update({
            where: { GuildId: conf.GuildId },
            data: {
              CurrentQuestion: questionText,
              CurrentAnswer: answerText,
              Answered: false,
            },
          });
          const channel = client.channels.cache.get(conf.QuizChannelId);
          if (
            channel &&
            channel.isTextBased() &&
            "send" in channel &&
            conf.QuizRoleId
          ) {
            channel.send(
              `❓ **Question** : ${questionText} <@&${conf.QuizRoleId}>`
            );
          } else if (channel && channel.isTextBased() && "send" in channel) {
            channel.send(`❓ **Question** : ${questionText}`);
          }
        } else if (conf.Answered === false) {
          console.log("Question déjà posée, pas de nouvelle question.");
          console.log("Question : ", conf.CurrentQuestion);
          console.log("Réponse : ", conf.CurrentAnswer);
          const channel = client.channels.cache.get(conf.QuizChannelId);
          if (
            channel &&
            channel.isTextBased() &&
            "send" in channel &&
            conf.QuizRoleId
          ) {
            channel.send(
              `❓ **Question** : ${conf.CurrentQuestion} <@&${conf.QuizRoleId}>`
            );
          } else if (channel && channel.isTextBased() && "send" in channel) {
            channel.send(`❓ **Question** : ${conf.CurrentQuestion}`);
          }
        }
      });
    });
}

// Vérifie la réponse
export async function validAnswer(message: Message<boolean>, client: Client) {
  await prisma.configuration.update({
    where: { GuildId: message.guild?.id },
    data: {
      Answered: true,
    },
  });
  message.reply(
    `🎉 Bonne réponse <@${message.author.id}> ! Tu gagnes 1 point.`
  );

  const discordId = message.author.id;
  const username = message.author.username;

  await prisma.user.upsert({
    where: { discordId, guildId: message.guild?.id },
    update: {
      score: { increment: 1 },
      username,
    },
    create: {
      discordId,
      username,
      score: 1,
      guildId: message.guild?.id,
    },
  });

  // Envoie la prochaine question
  // Si l'heure actuelle est entre 22h et 9h, attend jusqu'à 9h
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();
  console.log(
    "Heure actuelle :",
    currentHour,
    "h",
    currentMinute,
    "m",
    currentSecond,
    "s"
  );

  if (currentHour >= 22 || currentHour < 9) {
    const nineHour = 9 * 60 * 60 * 1000; // 9h en millisecondes
    const oneday = 24 * 60 * 60 * 1000; // 24h en millisecondes

    const timeElapsedToday =
      currentHour * 60 * 60 * 1000 +
      currentMinute * 60 * 1000 +
      currentSecond * 1000;

    const waitTime = (oneday - timeElapsedToday + nineHour) % oneday;
    console.log("Attendre jusqu'à 9h du matin avant la prochaine question...");
    console.log("Temps d'attente :", waitTime / 1000 / 60 / 60, "heures");
    setTimeout(() => {
      AskQuestion(client);
    }, waitTime);
    return;
  }
  // Sinon, attend entre 1H30 et 1H00
  const waitTime =
    Math.floor(Math.random() * (90 * 60 * 1000 - 60 * 60 * 1000 + 1)) +
    60 * 60 * 1000;
  console.log("Attendre entre 1h00 et 1h30 avant la prochaine question...");
  setTimeout(() => {
    AskQuestion(client);
  }, waitTime);
}

export function CreateHint(answer: string | null) {
  if (!answer) return;
  let hint = "";
  answer.split(" ").forEach((word) => {
    if (word.length > 1) {
      const wordmasked = word
        .split("")
        .map((char, index) => (index < 1 ? char.toUpperCase() : "\\_"))
        .join("");
      console.log("Indice : ", wordmasked);
      hint += wordmasked + " ";
    }
  });
  return hint;
}
