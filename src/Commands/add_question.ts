import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("add_question")
    .setDescription("Permet d'ajouter une question au quiz")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("La question à ajouter")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("réponse")
        .setDescription("La réponse à la question")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("La description de la question")
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
    const question = interaction.options.getString("question");
    const answer = interaction.options.getString("réponse");
    let description = interaction.options.getString("description");
    if (!question || !answer) {
      await interaction.reply({
        content: "❌ Question et réponse sont obligatoires.",
        ephemeral: true,
      });
      return;
    }
    await prisma.question.create({
      data: {
        text: question,
        answer,
        description: description ?? "",
      },
    });
    await interaction.reply({
      content: `✅ Question ajoutée :\n**Question** : ${question}\n**Réponse** : ${answer}`,
      ephemeral: true,
    });
  },
};

export default command;
