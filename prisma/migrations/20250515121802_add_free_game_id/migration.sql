/*
  Warnings:

  - The primary key for the `FreeGameId` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FreeGameId" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "displayed" BOOLEAN NOT NULL DEFAULT false,
    "embeb" TEXT
);
INSERT INTO "new_FreeGameId" ("displayed", "embeb", "endDate", "id", "name", "startDate") SELECT "displayed", "embeb", "endDate", "id", "name", "startDate" FROM "FreeGameId";
DROP TABLE "FreeGameId";
ALTER TABLE "new_FreeGameId" RENAME TO "FreeGameId";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
