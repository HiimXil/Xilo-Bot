-- AlterTable
ALTER TABLE "State" ADD COLUMN "wordleWord" TEXT;

-- CreateTable
CREATE TABLE "Wordle" (
    "guildId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "channel" TEXT,
    "tryCount" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("guildId", "discordId")
);
