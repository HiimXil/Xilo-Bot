import { channel } from "diagnostics_channel";
import { Logger } from "../Utils/Logger";
import { prisma } from "../Utils/prisma";
import type { Configuration, State, Wordle } from "../Utils/types";
import {
  ChannelType,
  PermissionsBitField,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
  Guild,
  EmbedBuilder,
  Message,
} from "discord.js";

export async function createWordleChannel(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) {
  const config: Configuration | null = await prisma.configuration.findFirst({
    where: { guildId: reaction.message.guild?.id },
  });
  if (!config) return;
  if (!config.wordleMessageId) return;
  if (reaction.message.id === config.wordleMessageId) {
    if (reaction.emoji.name === "🌍") {
      Logger.info("createWordleChannel: " + user.id);
      // Vérifie si le salon existe déjà
      const wordle = await prisma.wordle.findFirst({
        where: {
          guildId: reaction.message.guild?.id,
          discordId: reaction.users.cache.get(user.id)?.id,
        },
      });
      if (wordle && wordle.channel !== "" && wordle.channel !== null) return;
      //Create a new channel private for the user
      const newChannel = await reaction.message.guild?.channels.create({
        name: `wordle-${user.username}`,
        type: ChannelType.GuildText,
        parent: config.wordleCategoryId,
        permissionOverwrites: [
          {
            id: reaction.message.guild.id, // everyone
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: user.id, // l'utilisateur
            allow: ["ViewChannel"],
          },
          {
            id: process.env.CLIENT_ID!, // le bot
            allow: ["ViewChannel"],
          },
        ],
      });
      if (!newChannel) return;
      await prisma.user.upsert({
        where: {
          guildId_discordId: {
            guildId: reaction.message.guild!.id,
            discordId: user.id,
          },
        },
        update: {
          username: user.username,
        },
        create: {
          discordId: user.id,
          username: user.username,
          guildId: reaction.message.guild!.id,
        },
      });

      await prisma.wordle.upsert({
        where: {
          guildId_discordId: {
            guildId: reaction.message.guild!.id,
            discordId: user.id,
          },
        },
        update: {
          channel: newChannel.id,
        },
        create: {
          guildId: reaction.message.guild!.id,
          discordId: user.id,
          channel: newChannel.id,
        },
      });
      const state = await prisma.state.findFirst({
        where: { guildId: reaction.message.guild?.id },
      });
      if (!state) {
        Logger.error("State not found");
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle("Wordle")
        .setDescription(
          `Bienvenue dans le salon de Wordle !\n\nVous pouvez jouer au jeu ici.\n\nVous avez 6 tentatives\n\n
          Mot du jour : ${state.wordleWord?.replace(/./g, "⬜ ")}.`
        )
        .setColor(0x00ff00)
        .setTimestamp();
      newChannel.send({
        content: `<@${user.id}>`,
        embeds: [embed],
      });
    }
  }
}

export async function deleteWordleChannel(guild: Guild) {
  if (!guild) return;
  Logger.info(`deleteWordleChannel: ${guild.id}`);
  const wordles = await prisma.wordle.findMany({
    where: { guildId: guild.id },
  });
  for (const wordle of wordles) {
    const channel = guild.channels.cache.get(wordle.channel!);
    if (channel) {
      await channel.delete();
    }
  }
  // Supprime les salons de Wordle de la base de données
  await prisma.wordle.updateMany({
    where: { guildId: guild.id },
    data: { channel: null, tryCount: 0, resultSaved: "" },
  });
}

export async function checkWordle(message: Message) {
  const wordles = await prisma.wordle.findMany({
    where: { channel: { not: null } },
  });
  const index = wordles.findIndex(
    (w: Wordle) => w.channel === message.channel.id
  );

  if (index !== -1) {
    const wordleForUser = wordles[index];
    const state = await prisma.state.findFirst({
      where: { guildId: message.guild?.id },
    });
    if (!state || !state.wordleWord) {
      Logger.error("State not found or wordleWord is null");
      return;
    }
    const wordleWord = state.wordleWord.toLowerCase();
    const wordleTryCount = wordleForUser.tryCount;
    if (wordleTryCount >= 6) {
      message.reply("Vous avez déjà utilisé toutes vos tentatives.");
      return;
    }
    const wordleMessage = message.content.toLowerCase().trim();
    if (wordleMessage.length !== wordleWord.length) {
      message.reply(`Le mot doit faire ${wordleWord.length} lettres.`);
      return;
    }

    const wordleWordInEmoji = toRegionalIndicator(
      message.content.toLowerCase()
    );
    //vérifie si le mot est valide A IMPLEMENTER
    const wordInWordList = await prisma.wordleWord.findFirst({
      where: { word: wordleMessage.toUpperCase() },
    });
    if (!wordInWordList) {
      message.reply("Ce mot n'est pas valide.");
      return;
    }

    let result = Array(wordleWord.length).fill("🟥");
    const letterCount: Record<string, number> = {};
    for (let i = 0; i < wordleMessage.length; i++) {
      if (wordleMessage[i] === wordleWord[i]) {
        result[i] = "🟩";
      } else {
        letterCount[wordleWord[i]] = (letterCount[wordleWord[i]] || 0) + 1;
      }
    }

    for (let i = 0; i < wordleMessage.length; i++) {
      if (result[i] !== "🟩" && letterCount[wordleMessage[i]] > 0) {
        result[i] = "🟨";
        letterCount[wordleMessage[i]]--;
      }
    }
    const resultString = result.join(" ");

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
          wordleForUser.resultSaved +
          wordleWordInEmoji +
          "\n" +
          resultString +
          "\n",
      },
    });
    if (wordleTryCount + 1 >= 6) {
      message.reply(
        `Vous avez utilisé toutes vos tentatives ! Le mot était **${wordleWord}**.`
      );
    }
    message.reply(
      `**Essai ${wordleTryCount + 1}** :\n${
        wordleForUser.resultSaved
      }${wordleWordInEmoji}\n${resultString}`
    );
    if (wordleMessage === wordleWord) {
      message.reply(`🎉 Vous avez trouvé le mot du jour !`);
      return;
    }
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
}
