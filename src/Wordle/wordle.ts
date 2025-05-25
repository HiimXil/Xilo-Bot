import { channel } from "diagnostics_channel";
import { Logger } from "../Utils/Logger";
import { prisma } from "../Utils/prisma";
import { client } from "../Utils/Client";
import { generateKeyboardImage, KeyState } from "./keyboard";
import type { Configuration, State, Wordle } from "../Utils/types";
import {
  ChannelType,
  PermissionsBitField,
  ButtonInteraction,
  Guild,
  EmbedBuilder,
  Message,
  AttachmentBuilder,
} from "discord.js";

export async function createWordleChannel(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const config = await prisma.configuration.findFirst({
    where: { guildId: guild.id },
  });
  if (!config || !config.wordleMessageId) return;
  if (interaction.customId !== "CreateChannelWordle") return;

  const wordle = await prisma.wordle.findFirst({
    where: {
      guildId: guild.id,
      discordId: interaction.user.id,
    },
  });
  if (wordle?.channel) return;
  const newChannel = await guild.channels.create({
    name: `wordle-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: config.wordleCategoryId,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: process.env.CLIENT_ID!,
        allow: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
  if (!newChannel) return;

  Logger.info("Nouveau channel crée");
  await prisma.user.upsert({
    where: {
      guildId_discordId: {
        guildId: guild.id,
        discordId: interaction.user.id,
      },
    },
    update: {
      username: interaction.user.username,
    },
    create: {
      discordId: interaction.user.id,
      username: interaction.user.username,
      guildId: guild.id,
    },
  });

  await prisma.wordle.upsert({
    where: {
      guildId_discordId: {
        guildId: guild.id,
        discordId: interaction.user.id,
      },
    },
    update: {
      channel: newChannel.id,
    },
    create: {
      guildId: guild.id,
      discordId: interaction.user.id,
      channel: newChannel.id,
    },
  });

  const state = await prisma.state.findFirst({
    where: { guildId: guild.id },
  });
  if (!state) {
    Logger.error("State not found");
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Wordle")
    .setDescription(
      `Bienvenue dans le salon de Wordle !\n\nVous pouvez jouer au jeu ici.\n\nVous avez 6 tentatives\n\nMot du jour : ${state.wordleWord?.replace(
        /./g,
        "⬜ "
      )}`
    )
    .setColor(0x87e551)
    .setTimestamp();

  newChannel.send({
    content: `<@${interaction.user.id}>`,
    embeds: [embed],
  });

  await interaction.reply({
    content: "Votre salon Wordle a été créé.",
    ephemeral: true,
  });
}

export async function ResetWordle(guild: Guild) {
  if (!guild) return;
  Logger.info(`ResetWordle: ${guild.id}`);
  // Supprime les salons de Wordle de la base de données
  await prisma.wordle.updateMany({
    where: { guildId: guild.id },
    data: { tryCount: 0, resultSaved: "", done: 0, letterUsed: "" },
  });
}

export async function checkWordle(message: Message) {
  //Check if a word exist
  const state = await prisma.state.findFirst({
    where: { guildId: message.guild?.id },
  });
  if (!state || !state.wordleWord) {
    Logger.error("State not found or wordleWord is null");
    return;
  }
  const wordleWord = state.wordleWord.toLowerCase();

  //Get the player information
  const wordle = await prisma.wordle.findFirst({
    where: { channel: message.channel.id },
  });
  if (!wordle) {
    return;
  }
  if (wordle.done !== 0) {
    //TODO : Use discord way to indicate time "in 10 mins"
    message.reply(
      "Vous avez déjà jouer aujourd'hui. Merci d'attendre demain pour le nouveau mot!"
    );
    return;
  }

  const wordleMessage = message.content.toLowerCase().trim();
  if (wordleMessage.length !== wordleWord.length) {
    message.reply(`Le mot doit faire ${wordleWord.length} lettres.`);
    return;
  }

  const wordleWordInEmoji = toRegionalIndicator(message.content.toLowerCase());
  const wordInWordList = await prisma.wordleWord.findFirst({
    where: { word: wordleMessage.toUpperCase() },
  });
  if (!wordInWordList) {
    message.reply("Ce mot n'est pas valide.");
    return;
  }
  let wordleUsedLetter = wordle.letterUsed;
  if (wordleUsedLetter === "") {
    wordleUsedLetter = "||";
  }
  //0 = Good letter Good Placement 1 = Good letter Bad Placement 2 = Bad Letter Bad Placement
  const LetterUsedArray = wordleUsedLetter.split("|");

  let result = Array(wordleWord.length).fill("🟥");
  const letterCount: Record<string, number> = {};
  for (let i = 0; i < wordleMessage.length; i++) {
    if (wordleMessage[i] === wordleWord[i]) {
      result[i] = "🟩";
      if (!LetterUsedArray[0].includes(wordleMessage[i])) {
        LetterUsedArray[0] += wordleMessage[i];
      }
    } else {
      letterCount[wordleWord[i]] = (letterCount[wordleWord[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < wordleMessage.length; i++) {
    if (result[i] !== "🟩" && letterCount[wordleMessage[i]] > 0) {
      result[i] = "🟨";
      letterCount[wordleMessage[i]]--;
      if (
        !LetterUsedArray[0].includes(wordleMessage[i]) &&
        !LetterUsedArray[1].includes(wordleMessage[i])
      ) {
        LetterUsedArray[1] += wordleMessage[i];
      }
    }
  }
  for (let i = 0; i < wordleMessage.length; i++) {
    if (
      !LetterUsedArray[0].includes(wordleMessage[i]) &&
      !LetterUsedArray[1].includes(wordleMessage[i]) &&
      !LetterUsedArray[2].includes(wordleMessage[i])
    ) {
      LetterUsedArray[2] += wordleMessage[i];
    }
  }
  wordleUsedLetter = LetterUsedArray.join("|");
  const resultString = result.join(" ");

  await prisma.wordle.update({
    where: {
      guildId_discordId: {
        guildId: message.guild!.id,
        discordId: message.author.id,
      },
    },
    data: {
      letterUsed: wordleUsedLetter,
    },
  });

  const wordleTryCount = wordle.tryCount;

  await prisma.wordle.update({
    where: {
      guildId_discordId: {
        guildId: message.guild!.id,
        discordId: message.author.id,
      },
    },
    data: {
      tryCount: wordleTryCount + 1,
      resultSaved:
        wordle.resultSaved + wordleWordInEmoji + "\n" + resultString + "\n",
    },
  });

  const disabled = LetterUsedArray[2].split("");
  const present = LetterUsedArray[1].split("");
  const correct = LetterUsedArray[0].split("");

  const keyStates: Record<string, KeyState> = {
    ...Object.fromEntries(
      disabled.map(
        (letter: string) => [letter.toUpperCase(), "disabled"] as const
      )
    ),
    ...Object.fromEntries(
      present.map(
        (letter: string) => [letter.toUpperCase(), "present"] as const
      )
    ),
    ...Object.fromEntries(
      correct.map(
        (letter: string) => [letter.toUpperCase(), "correct"] as const
      )
    ),
  };

  const buffer = generateKeyboardImage({ keyStates });
  const attachment = new AttachmentBuilder(buffer, { name: "keyboard.png" });

  message.reply({
    content: `**Essai ${wordleTryCount + 1}/6** :\n${
      wordle.resultSaved
    }${wordleWordInEmoji}\n${resultString}`,
    files: [attachment],
  });

  if (wordleMessage === wordleWord) {
    await prisma.wordle.update({
      where: {
        guildId_discordId: {
          guildId: message.guild!.id,
          discordId: message.author.id,
        },
      },
      data: {
        done: 2,
      },
    });
    message.reply(`🎉 Vous avez trouvé le mot du jour !`);
    return;
  }

  if (wordleTryCount + 1 >= 6) {
    await prisma.wordle.update({
      where: {
        guildId_discordId: {
          guildId: message.guild!.id,
          discordId: message.author.id,
        },
      },
      data: {
        done: 1,
      },
    });
    message.reply(
      `Vous avez utilisé toutes vos tentatives ! Le mot était **${wordleWord}**.`
    );
  }
}

function toRegionalIndicator(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((char) => {
      if (char >= "a" && char <= "z") {
        return `:regional_indicator_${char}:`;
      }
      return char; // conserver les autres caractères tels quels
    })
    .join(" ");
}

export async function ChooseWordleWord() {
  // Recupere le nombre de mot dans la base de données
  const wordleWords = await prisma.wordleWord.findMany({
    select: { id: true, word: true },
    where: { canBeRoll: true },
  });
  const howManyWord = wordleWords.length;
  // Tire un mot au hasard
  const randomIndex = Math.floor(Math.random() * howManyWord);
  const wordleWord = wordleWords[randomIndex];
  if (!wordleWord) {
    Logger.error("Wordle word not found");
    return;
  }
  console.log("Mot du jour : " + wordleWord.word);
  // Met à jour le mot du jour dans la base de données
  await prisma.state.updateMany({
    data: { wordleWord: wordleWord.word },
  });
  const wordleChannel = await prisma.wordle.findMany({
    where: { channel: { not: null } },
    select: { channel: true, guildId: true },
  });
  // Envoie un message dans chaque salon de Wordle
  for (const channel of wordleChannel) {
    const guild = client.guilds.cache.get(channel.guildId);
    if (!guild) continue;

    if (!channel.channel) continue;
    const textChannel = guild.channels.cache.get(channel.channel);
    if (!textChannel || !textChannel.isTextBased()) continue;

    try {
      await textChannel.send(
        "Nouveau Mot Disponible ! Le mot fait " +
          wordleWord.word.length +
          " lettres"
      );
    } catch (error) {
      console.error(
        `Erreur lors de l'envoi dans le salon ${channel.channel}:`,
        error
      );
    }
  }
}
