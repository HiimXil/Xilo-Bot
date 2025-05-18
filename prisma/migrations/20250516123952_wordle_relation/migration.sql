-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "guildId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "username" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("guildId", "discordId")
);
INSERT INTO "new_User" ("discordId", "guildId", "score", "username") SELECT "discordId", "guildId", "score", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
