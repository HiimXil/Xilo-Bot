import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";
import { State } from "../Utils/types";
import { CreateHint } from "../Quiz/quiz";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("hint")
    .setDescription(
      "Donne un indice pour trouver la réponse à la question"
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
    if (state.answered === true) {
      await interaction.reply({
        content: "❌ Aucune question en cours.",
        ephemeral: true,
      });
      return;
    }
    const hint = CreateHint(state.currentAnswer);
    await interaction.reply({
      content: `💡 Indice : ${hint}`,
      ephemeral: false,
    });
  },
};

export default command;
