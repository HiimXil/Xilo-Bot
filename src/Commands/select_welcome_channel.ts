import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("select_welcome_channel")
    .setDescription(
      "Sélectionne le salon où les messages de bienvenue seront envoyés"
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Le salon où les messages de bienvenue seront envoyés")
        .setRequired(true)
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
    await prisma.configuration.upsert({
      where: { guildId: interaction.guild.id },
      update: {
        welcomeChannelId: interaction.options.getChannel("channel")?.id,
      },
      create: {
        guildId: interaction.guild.id,
        welcomeChannelId: interaction.options.getChannel("channel")?.id,
      },
    });
    await interaction.reply({
      content: `✅ Salon de bienvenue configuré dans ${interaction.options
        .getChannel("channel")
        ?.toString()} !`,
      ephemeral: true,
    });
  },
};

export default command;
