import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";
import type { User } from "../Utils/types";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("topscore")
    .setDescription(
      "Affiche les meilleurs scores du serveur"
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
    const top = await prisma.user.findMany({
      where: { guildId: interaction.guild?.id },
      orderBy: { score: "desc" },
    });

    if (top.length === 0) {
      await interaction.reply("Aucun score enregistré pour l'instant !");
      return;
    }
    let topMessage = "";
    for (let i = 0; i < 5; i++) {
      if (top[i] === undefined) break;
      topMessage += `**${i + 1}.** <@${top[i].discordId}> — ${
        top[i].score
      } pts \n`;
    }

    // If the user is not in the top 5, add their score at the end of the message
    const userIndex = top.findIndex(
      (user: User) => user.discordId === interaction.user.id
    );
    if (userIndex > 4) {
      topMessage += `\n**${userIndex + 1}.** <@${interaction.user.id}> — ${
        top[userIndex].score
      } pts \n`;
    }

    await interaction.reply({
      content: `🏆 **Top 5 des scores** :\n\n${topMessage}`,
      allowedMentions: { users: [] }, // disables the ping
    });
  },
};

export default command;
