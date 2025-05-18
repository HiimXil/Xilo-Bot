-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WordleWord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word" TEXT NOT NULL,
    "canBeRoll" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_WordleWord" ("id", "word") SELECT "id", "word" FROM "WordleWord";
DROP TABLE "WordleWord";
ALTER TABLE "new_WordleWord" RENAME TO "WordleWord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
