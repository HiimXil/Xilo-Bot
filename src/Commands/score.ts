import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("score")
    .setDescription("Affiche ton score ou celui d'un autre membre")
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur dont tu veux voir le score")
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
    const targetUser =
      interaction.options.getUser("utilisateur") || interaction.user;
    const discordId = targetUser.id;

    const user = await prisma.user.findUnique({
      where: {
        guildId_discordId: { discordId, guildId: interaction.guild?.id },
      },
    });

    const score = user?.score ?? 0;

    await interaction.reply({
      content: `🏆 <@${targetUser.id}> a **${score} point${
        score !== 1 ? "s" : ""
      }**.`,
      allowedMentions: { users: [] }, // disables the ping
    });
  },
};

export default command;
