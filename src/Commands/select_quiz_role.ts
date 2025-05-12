import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("select_quiz_role")
    .setDescription("Sélectionne le rôle qui sera ping pour jouer au quiz")
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("le rôle qui sera ping pour jouer au quiz")
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
    const role = interaction.options.getRole("role");
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: "❌ Cette commande ne peut pas être utilisée ici.",
        ephemeral: true,
      });
      return;
    }
    if (!role) {
      await interaction.reply({
        content: "❌ Veuillez sélectionner un rôle.",
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
        data: { quizRoleId: role.id },
      });
    } else {
      await interaction.reply({
        content: `❌ Veuillez d'abord sélectionner un salon.`,
        ephemeral: true,
      });
    }
    await interaction.reply({
      content: `✅ Rôle sélectionné`,
      ephemeral: true,
    });
  },
};

export default command;
