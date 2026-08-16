-- CreateTable
CREATE TABLE "Bet" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "game" TEXT NOT NULL,
    "betType" TEXT NOT NULL,
    "pick" TEXT NOT NULL,
    "odds" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payout" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);
