import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  CommandInteraction,
} from "discord.js";
import type Command from "../interfaces/Command";
import { prisma } from "../Utils/prisma";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("sugest_question")
    .setDescription(
      "Permet d'ajouter une question au quiz"
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
    const modal = new ModalBuilder()
      .setCustomId("add_question")
      .setTitle("Ajouter une question");

    const questionInput = new TextInputBuilder()
      .setCustomId("question")
      .setLabel("Question")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const answerInput = new TextInputBuilder()
      .setCustomId("answer")
      .setLabel("Réponse")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      questionInput
    );
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      answerInput
    );
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      descriptionInput
    );

    modal.addComponents(row1, row2, row3);

    await interaction.showModal(modal);
  },
};

export default command;
