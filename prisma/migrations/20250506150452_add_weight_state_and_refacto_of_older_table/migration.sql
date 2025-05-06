/*
  Warnings:

  - The primary key for the `Configuration` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `Answered` on the `Configuration` table. All the data in the column will be lost.
  - You are about to drop the column `CurrentAnswer` on the `Configuration` table. All the data in the column will be lost.
  - You are about to drop the column `CurrentQuestion` on the `Configuration` table. All the data in the column will be lost.
  - You are about to drop the column `GuildId` on the `Configuration` table. All the data in the column will be lost.
  - You are about to drop the column `QuizChannelId` on the `Configuration` table. All the data in the column will be lost.
  - You are about to drop the column `QuizRoleId` on the `Configuration` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `Question` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - Added the required column `guildId` to the `Configuration` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Weight" (
    "questionId" INTEGER NOT NULL,
    "guildId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY ("guildId", "questionId"),
    CONSTRAINT "Weight_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Weight_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "State" ("guildId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "State" (
    "guildId" TEXT NOT NULL PRIMARY KEY,
    "currentQuestion" TEXT,
    "currentAnswer" TEXT,
    "answered" BOOLEAN NOT NULL DEFAULT false
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Configuration" (
    "guildId" TEXT NOT NULL PRIMARY KEY,
    "quizChannelId" TEXT,
    "quizRoleId" TEXT
);
DROP TABLE "Configuration";
ALTER TABLE "new_Configuration" RENAME TO "Configuration";
CREATE TABLE "new_Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "description" TEXT NOT NULL
);
INSERT INTO "new_Question" ("answer", "description", "id", "text") SELECT "answer", "description", "id", "text" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE TABLE "new_User" (
    "guildId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("guildId", "discordId")
);
INSERT INTO "new_User" ("discordId", "guildId", "score", "username") SELECT "discordId", "guildId", "score", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
