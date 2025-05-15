import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("setup_freegame")
    .setDescription("Configure le salon où les jeux gratuit seront signalé")
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("le rôle qui sera ping pour jouer le jeu gratuit")
        .setRequired(false)
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
    if (interaction.options.getRole("role") === null) {
      const channel = interaction.channel;
      await prisma.configuration.upsert({
        where: { guildId: interaction.guild.id },
        update: { freeGameChannelId: channel?.id },
        create: {
          guildId: interaction.guild.id,
          freeGameChannelId: channel?.id,
        },
      });
      await interaction.reply({
        content: `✅ Salon sélectionné`,
        ephemeral: true,
      });
    } else {
      const channel = interaction.channel;
      await prisma.configuration.upsert({
        where: { guildId: interaction.guild.id },
        update: {
          freeGameChannelId: channel?.id,
          freeGameRoleId: interaction.options.getRole("role")?.id,
        },
        create: {
          guildId: interaction.guild.id,
          freeGameChannelId: channel?.id,
          freeGameRoleId: interaction.options.getRole("role")?.id,
        },
      });
      await interaction.reply({
        content: `✅ Salon sélectionné`,
        ephemeral: true,
      });
    }
  },
};

export default command;
