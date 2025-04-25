-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Configuration" (
    "GuildId" TEXT NOT NULL PRIMARY KEY,
    "QuizChannelId" TEXT NOT NULL,
    "CurrentQuestion" TEXT,
    "CurrentAnswer" TEXT,
    "Answered" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Configuration" ("GuildId", "QuizChannelId") SELECT "GuildId", "QuizChannelId" FROM "Configuration";
DROP TABLE "Configuration";
ALTER TABLE "new_Configuration" RENAME TO "Configuration";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
