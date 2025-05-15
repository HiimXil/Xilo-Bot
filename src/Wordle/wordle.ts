import { Logger } from "../Utils/Logger";
import { prisma } from "../Utils/prisma";
import type { Configuration, State } from "../Utils/types";
import {
  ChannelType,
  PermissionsBitField,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
  Guild,
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
    data: { channel: null, tryCount: 0 },
  });
}
