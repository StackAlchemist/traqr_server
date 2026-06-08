-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "rawText" TEXT,
ALTER COLUMN "merchant" DROP NOT NULL,
ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "transactionAt" DROP NOT NULL;
