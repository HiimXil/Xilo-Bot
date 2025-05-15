import { Logger } from "../Utils/Logger";
import type { EpicGamesFree } from "./type";
import { EmbedBuilder } from "discord.js";
import { prisma } from "../Utils/prisma";
import { client } from "../Utils/Client";

export async function epicFreeGames() {
  Logger.info("Récupération des jeux gratuits Epic Games");
  const url =
    "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions";
  const params = {
    country: "FR",
    locale: "fr-FR",
    allowCountries: "FR",
    sortDirection: "DESC",
    sortField: "startDate",
    withPrice: "true",
    withPromotion: "true",
  };

  try {
    const response = await fetch(`${url}?${new URLSearchParams(params)}`);
    const data: EpicGamesFree = await response.json();

    for (const game of data.data.Catalog.searchStore.elements) {
      const title = game.title;
      const originalPrice = game.price.totalPrice.originalPrice;
      const price = game.price.totalPrice.discountPrice;
      const urlSlug = game.urlSlug;
      const image = game.keyImages.find(
        (img) => img.type === "OfferImageWide"
      )?.url;

      if (game.promotions && game.promotions.promotionalOffers.length > 0) {
        const offer = game.promotions.promotionalOffers[0].promotionalOffers[0];
        const startDate = new Date(offer.startDate);
        const endDate = new Date(offer.endDate);

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(
            `**Open in :**\n- [Epicgames.com](https://store.epicgames.com/fr/p/${urlSlug}) | [Epic Launcher](https://store.epicgames.com/launch)\n\n**~~${(
              originalPrice / 100
            ).toFixed(2)}€~~ -> ${price}€**\n\n🕒 End in <t:${Math.floor(
              endDate.getTime() / 1000
            )}:R>`
          )
          .setColor(0x2374e1)
          .setImage(image || "");

        await prisma.freeGameId.upsert({
          where: { id: game.id },
          update: {},
          create: {
            id: game.id,
            name: title,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        });

        const existingGame = await prisma.freeGameId.findUnique({
          where: { id: game.id },
        });
        if (!existingGame?.displayed) {
          const guilds = await prisma.configuration.findMany({
            where: { freeGameChannelId: { not: null } },
          });
          for (const guild of guilds) {
            const channel = await guild.freeGameChannelId;
            if (channel) {
              const guildChannel = await client.channels.fetch(channel);
              if (
                guildChannel &&
                guildChannel.isTextBased() &&
                "send" in guildChannel
              ) {
                if (guild.freeGameRoleId) {
                  await guildChannel.send({
                    content: `<@&${guild.freeGameRoleId}>`,
                    embeds: [embed],
                  });
                } else {
                  await guildChannel.send({ embeds: [embed] });
                }
              } else {
                Logger.error(`Le salon ${channel} n'existe pas`);
              }
            } else {
              Logger.error(`Le salon ${channel} n'existe pas`);
            }
          }
          await prisma.freeGameId.update({
            where: { id: game.id },
            data: { displayed: true },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
