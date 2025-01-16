-- CreateTable
CREATE TABLE "Thrips" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tea" INTEGER NOT NULL,
    "other" INTEGER NOT NULL,

    CONSTRAINT "Thrips_pkey" PRIMARY KEY ("id")
);
