import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("select_quiz_channel")
    .setDescription(
      "Sélectionne le salon où le quiz sera joué"
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
  },
};

export default command;
