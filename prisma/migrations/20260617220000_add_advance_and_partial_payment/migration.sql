-- AlterTable: partial payment tracking on Wage (additive, no data touched)
ALTER TABLE "Wage" ADD COLUMN "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Wage" ADD COLUMN "advanceConsumed" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill: wages already marked paid are fully covered
UPDATE "Wage" SET "paidAmount" = "amount" WHERE "paid" = true;

-- CreateTable
CREATE TABLE "Advance" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Advance" ADD CONSTRAINT "Advance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
