import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";
import { State } from "../Utils/types";
import { timeouts, AskQuestion } from "../Quiz/quiz";
import { client } from "../Utils/Client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("trigger")
    .setDescription(
      "Déclenche le quiz dans le salon sélectionné"
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
    if (state?.answered === false) {
      await interaction.reply({
        content: "❌ Une question est déjà en cours.",
        ephemeral: true,
      });
      return;
    }
    if (timeouts[interaction.guild?.id]) {
      clearTimeout(timeouts[interaction.guild.id]!);
    }
    AskQuestion(client);
    await interaction.reply({
      content: "✅ Question envoyée.",
      ephemeral: true,
    });
  },
};

export default command;
