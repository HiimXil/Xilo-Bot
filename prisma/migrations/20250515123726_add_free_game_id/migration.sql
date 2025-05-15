/*
  Warnings:

  - You are about to drop the column `discountPrice` on the `FreeGameId` table. All the data in the column will be lost.
  - You are about to drop the column `embeb` on the `FreeGameId` table. All the data in the column will be lost.
  - You are about to drop the column `originalPrice` on the `FreeGameId` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FreeGameId" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "displayed" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_FreeGameId" ("displayed", "endDate", "id", "name", "startDate") SELECT "displayed", "endDate", "id", "name", "startDate" FROM "FreeGameId";
DROP TABLE "FreeGameId";
ALTER TABLE "new_FreeGameId" RENAME TO "FreeGameId";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
