-- CreateTable
CREATE TABLE "Configuration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "GuildId" TEXT NOT NULL,
    "ChannelId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Configuration_GuildId_key" ON "Configuration"("GuildId");
