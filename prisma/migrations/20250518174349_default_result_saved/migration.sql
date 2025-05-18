-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wordle" (
    "guildId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "channel" TEXT,
    "resultSaved" TEXT NOT NULL DEFAULT '',
    "tryCount" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("guildId", "discordId"),
    CONSTRAINT "Wordle_guildId_discordId_fkey" FOREIGN KEY ("guildId", "discordId") REFERENCES "User" ("guildId", "discordId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Wordle" ("channel", "discordId", "guildId", "resultSaved", "tryCount") SELECT "channel", "discordId", "guildId", coalesce("resultSaved", '') AS "resultSaved", "tryCount" FROM "Wordle";
DROP TABLE "Wordle";
ALTER TABLE "new_Wordle" RENAME TO "Wordle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
