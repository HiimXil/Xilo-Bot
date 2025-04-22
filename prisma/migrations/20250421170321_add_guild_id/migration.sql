/*
  Warnings:

  - The primary key for the `Configuration` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ChannelId` on the `Configuration` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Configuration` table. All the data in the column will be lost.
  - Added the required column `QuizChannelId` to the `Configuration` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Configuration" (
    "GuildId" TEXT NOT NULL PRIMARY KEY,
    "QuizChannelId" TEXT NOT NULL
);
INSERT INTO "new_Configuration" ("GuildId") SELECT "GuildId" FROM "Configuration";
DROP TABLE "Configuration";
ALTER TABLE "new_Configuration" RENAME TO "Configuration";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "guildId" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_User" ("discordId", "id", "score", "username") SELECT "discordId", "id", "score", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
