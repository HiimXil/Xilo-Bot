import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("share_wordle")
    .setDescription("Partage tes resultats de wordle") as SlashCommandBuilder,

  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ Cette commande ne peut pas être utilisée ici.",
        ephemeral: true,
      });
      return;
    }
    const wordle = await prisma.wordle.findFirst({
      where: {
        guildId: interaction.guild!.id,
        discordId: interaction.user.id,
      },
    });
    if (!wordle) {
      interaction.reply({
        content: "Vous n'avez jamais jouer au wordle",
        flags: "Ephemeral",
      });
      return;
    }

    if (wordle?.done === 0) {
      interaction.reply({
        content: "Vous n'avez pas fini le wordle du jour",
        flags: "Ephemeral",
      });
      return;
    }
    let finalResult: string = "";
    const userResult = wordle?.resultSaved.split("\n");
    for (let i = 1; i < userResult.length; i += 2) {
      finalResult += userResult[i] + "\n";
    }
    interaction.reply({
      content: "Wordle en " + wordle.tryCount + " essais\n" + finalResult,
    });
  },
};

export default command;
