import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("set_score")
    .setDescription("Initialise le score d'un utilisateur")
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("L'utilisateur dont tu veux voir le score")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("score")
        .setDescription("Le score de l'utilisateur")
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
    const targetUser =
      interaction.options.getUser("utilisateur") || interaction.user;
    const discordId = targetUser.id;
    const score = interaction.options.getInteger("score");

    if (score === null) {
      await interaction.reply({
        content: "❌ Le score doit être un nombre.",
        ephemeral: true,
      });
      return;
    }

    await prisma.user.upsert({
      where: {
        guildId_discordId: { guildId: interaction.guild?.id, discordId },
      },
      update: { score },
      create: {
        discordId,
        username: targetUser.username,
        score,
        guildId: interaction.guild?.id,
      },
    });

    await interaction.reply({
      content: `✅ Score de <@${targetUser.id}> mis à jour : ${score} points.`,
      ephemeral: true,
    });
  },
};

export default command;
