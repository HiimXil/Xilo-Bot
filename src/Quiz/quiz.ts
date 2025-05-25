import { time } from "console";
import { prisma } from "../Utils/prisma";
import { generateMathQuestion } from "./mathQuestion";
import { Configuration, Question, Weight } from "../Utils/types";
import { Message, Client } from "discord.js";

//Tableau qui stocke les timeout de chaque guildId
export const timeouts: { [key: string]: NodeJS.Timeout | null } = {};

// Génération de la question
async function generateQuestion(
  guildId: string
): Promise<string[] | undefined> {
  let questionText: string = "";
  let answerText: string = "";
  console.log("Nouvelle question...");
  // 90%/10% chance question de base ou math
  if (Math.random() < 0.9) {
    console.log("Question de la base de données");
    await GenerateWeight(guildId);
    // Récupère toutes les questions avec leur poids
    const weights: Weight[] = await prisma.weight.findMany({
      select: {
        questionId: true,
        guildId: true,
        weight: true,
      },
    });

    // Crée un pool où chaque question apparaît autant de fois que son poids
    const weightedPool: Question[] = [];
    for (const w of weights) {
      // Récupère la question correspondante
      const question = await prisma.question.findUnique({
        where: { id: w.questionId },
      });
      if (!question) return;
      for (let i = 0; i < w.weight; i++) {
        weightedPool.push(question);
      }
    }
    // Tire une question au hasard dans le pool pondéré
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    const question = weightedPool[randomIndex];
    console.log("Question tirée : ", question);

    // reinitialise le poids de la question tirée et ajoute 1 a toutes les autres questions mais pas dans ce sens pcq sinon ce serait bête
    await prisma.weight.updateMany({
      where: {
        guildId: guildId,
        questionId: { not: question.id },
      },
      data: {
        weight: { increment: 1 },
      },
    });
    await prisma.weight.update({
      where: {
        guildId_questionId: { guildId: guildId, questionId: question.id },
      },
      data: {
        weight: 0,
      },
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
  // Recupére chaque configuration (Serveur)
  await prisma.configuration
    .findMany()
    .then(async (config: Configuration[]) => {
      if (!config) {
        console.log("Aucun serveur pour le quiz.");
        return;
      }
      config.forEach(async (conf: Configuration) => {
        if (!conf.quizChannelId) {
          console.log("Aucun salon configuré pour le quiz.");
          return;
        }
        const state = await prisma.state.findUnique({
          where: { guildId: conf.guildId },
        });

        // Si on a pas de State ou que on a jamais poser de question ou que on a déjà répondu
        if (
          !state ||
          state.currentQuestion === "" ||
          state.currentQuestion === null ||
          state.currentAnswer === "" ||
          state.currentAnswer === null ||
          state.answered
        ) {
          const result = await generateQuestion(conf.guildId);
          if (!result) {
            console.log("Failed to generate a question.");
            return;
          }
          const [questionText, answerText] = result;
          console.log("Update de la question pour la guilde : ", conf.guildId);
          await prisma.state.upsert({
            where: { guildId: conf.guildId },
            update: {
              currentQuestion: questionText,
              currentAnswer: answerText,
              answered: false,
            },
            create: {
              guildId: conf.guildId,
              currentQuestion: questionText,
              currentAnswer: answerText,
              answered: false,
            },
          });

          const channel = client.channels.cache.get(conf.quizChannelId);
          if (channel && channel.isTextBased() && "send" in channel) {
            if (conf.quizRoleId) {
              channel.send(
                `:grey_question: **Question** dans 15 secondes <@&${conf.quizRoleId}>`
              );
              await new Promise((resolve) => setTimeout(resolve, 15000));
              channel.send(`❓ **Question** : ${questionText}`);
            } else {
              channel.send(`:grey_question: **Question** dans 15 secondes`);
              await new Promise((resolve) => setTimeout(resolve, 15000));
              channel.send(`❓ **Question** : ${questionText}`);
            }
          }
          return;
        }
        // Si la question a déjà été posée et que la réponse n'a pas été donnée
        else if (state.answered === false) {
          console.log("Question déjà posée, pas de nouvelle question.");
          console.log("Question : ", state.currentQuestion);
          console.log("Réponse : ", state.currentAnswer);
          const channel = client.channels.cache.get(conf.quizChannelId);
          if (channel && channel.isTextBased() && "send" in channel) {
            if (conf.quizRoleId) {
              channel.send(
                `:grey_question: **Question** dans 15 secondes <@&${conf.quizRoleId}>`
              );
              await new Promise((resolve) => setTimeout(resolve, 15000));
              channel.send(`❓ **Question** : ${state.currentQuestion}`);
            } else {
              channel.send(`:grey_question: **Question** dans 15 secondes`);
              await new Promise((resolve) => setTimeout(resolve, 15000));
              channel.send(`❓ **Question** : ${state.currentQuestion}`);
            }
          }
          return;
        }
      });
    });
}

// Vérifie la réponse
export async function validAnswer(message: Message<boolean>, client: Client) {
  await prisma.state.update({
    where: { guildId: message.guild?.id },
    data: {
      answered: true,
    },
  });
  message.reply(
    `🎉 Bonne réponse <@${message.author.id}> ! Tu gagnes 1 point.`
  );

  const discordId = message.author.id;
  const username = message.author.username;

  await prisma.user.upsert({
    where: {
      guildId_discordId: {
        guildId: message.guild?.id!,
        discordId: discordId,
      },
    },
    update: {
      score: { increment: 1 },
      username,
    },
    create: {
      discordId: discordId,
      username,
      score: 1,
      guildId: message.guild?.id!,
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
    timeouts[message.guild?.id!] = setTimeout(() => {
      AskQuestion(client);
    }, waitTime);
    return;
  }
  // Sinon, attend entre 1H30 et 1H00
  const waitTime =
    Math.floor(Math.random() * (90 * 60 * 1000 - 60 * 60 * 1000 + 1)) +
    60 * 60 * 1000;
  console.log("Attendre entre 1h00 et 1h30 avant la prochaine question...");
  timeouts[message.guild?.id!] = setTimeout(() => {
    AskQuestion(client);
  }, waitTime);
}

// Crée un indice à partir de la réponse
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

async function GenerateWeight(guildId: string) {
  const questions: Question[] = await prisma.question.findMany();
  for (const question of questions) {
    if (!question) continue;
    await prisma.weight.upsert({
      where: {
        guildId_questionId: { questionId: question.id, guildId: guildId },
      },
      update: {},
      create: {
        questionId: question.id,
        guildId: guildId,
        weight: 1,
      },
    });
  }
}
