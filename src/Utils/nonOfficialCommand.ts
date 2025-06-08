import { Message, Client, OmitPartialGroupDMChannel } from "discord.js";
import { ChooseWordleWord, ResetWordle } from "../Wordle/wordle";
import { epicFreeGames } from "../EpicGames/epicFreeGames";
import { prisma } from "./prisma";
import { Logger } from "./Logger";
export async function handleNonOfficialCommand(
  message: OmitPartialGroupDMChannel<Message<boolean>>
) {
  if (message.author.id === process.env.ADMIN_USER_ID) {
    if (message.content === "!chooseWordleWord") {
      ResetWordle(message.guild!);
      ChooseWordleWord();
      return;
    }
    if (message.content === "!suggestQuestion") {
      Logger.info(
        `Change suggest question channel to ${message.channel.id} for guild ${
          message.guild!.id
        }`
      );
      await prisma.configuration.update({
        where: { guildId: message.guild!.id },
        data: { quizSugestChannelId: message.channel.id },
      });
    }

    if (message.content === "!clear") {
      // Supprime les x derniers message du channel
      const channel = message.channel;
      const messages = await channel.messages.fetch({ limit: 1 });
      const messagesToDeleteCount = messages.size;
      if (messagesToDeleteCount > 0 && "bulkDelete" in channel) {
        await channel.bulkDelete(messages);
      }
      return;
    }
    if (message.content === "!triggerFreeGame") {
      epicFreeGames();
      return;
    }
  }
  if (message.content === "!ping") {
    message.reply("Pong !");
    return;
  }
}
