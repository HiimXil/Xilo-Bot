import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";
import type { State } from "../Utils/types";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("explain")
    .setDescription(
      "Explique la réponse à la question actuelle"
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
    const state: State | null = await prisma.state.findFirst({
      where: { guildId: interaction.guild?.id },
    });
    if (!state) {
      await interaction.reply({
        content: "❌ Aucune question en cours.",
        ephemeral: true,
      });
      return;
    }
    if (state.answered === false) {
      await interaction.reply({
        content: "❌ Faut répondre avant :)",
        ephemeral: true,
      });
      return;
    }
    const question = await prisma.question.findFirst({
      where: { text: state.currentQuestion ?? "" },
    });
    if (!question) {
      await interaction.reply({
        content: "❌ Aucune question trouvée.",
        ephemeral: true,
      });
      return;
    }
    await interaction.reply({
      content: `📖 Explication : ${question.description}`,
      ephemeral: false,
    });
  },
};

export default command;
