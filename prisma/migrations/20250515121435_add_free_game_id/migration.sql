-- AlterTable
ALTER TABLE "Configuration" ADD COLUMN "freeGameChannelId" TEXT;

-- CreateTable
CREATE TABLE "FreeGameId" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "displayed" BOOLEAN NOT NULL DEFAULT false
);
