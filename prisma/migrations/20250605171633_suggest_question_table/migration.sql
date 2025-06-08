-- CreateTable
CREATE TABLE "SuggestedQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "username" TEXT NOT NULL
);
