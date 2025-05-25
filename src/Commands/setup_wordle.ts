import {
  SlashCommandBuilder,
  type CommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("setup_wordle")
    .setDescription(
      "Configure le salon où le Wordle sera joué"
    ) as SlashCommandBuilder,

  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ Cette commande ne peut pas être utilisée ici.",
        ephemeral: true,
      });
      return;
    }
    const channel = interaction.channel;
    if (channel?.isTextBased() && "send" in channel && "parentId" in channel) {
      const bouton = new ButtonBuilder()
        .setCustomId("CreateChannelWordle")
        .setLabel("Jouer")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(bouton);

      const message = await channel.send({
        content: "Utiliser le bouton ci-dessous pour jouer au Wordle!",
        components: [row],
      });

      const categoryId = channel.parentId;
      await prisma.configuration.upsert({
        where: { guildId: interaction.guild.id },
        update: {
          wordleMessageId: (await message).id,
          wordleCategoryId: categoryId,
        },
        create: {
          guildId: interaction.guild.id,
          wordleMessageId: (await message).id,
          wordleCategoryId: categoryId,
        },
      });
      await interaction.reply({
        content: `✅ Wordle configuré dans le salon ${channel} !`,
        ephemeral: true,
      });
    }
  },
};

export default command;
