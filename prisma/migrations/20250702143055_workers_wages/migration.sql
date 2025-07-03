/*
  Warnings:

  - You are about to drop the column `storeId` on the `Worker` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Worker" DROP CONSTRAINT "Worker_storeId_fkey";

-- AlterTable
ALTER TABLE "WorkShift" ADD COLUMN     "wageId" TEXT;

-- AlterTable
ALTER TABLE "Worker" DROP COLUMN "storeId",
ADD COLUMN     "dailyWage" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Wage" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "workShiftId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WorkerStores" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WorkerStores_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wage_workShiftId_key" ON "Wage"("workShiftId");

-- CreateIndex
CREATE INDEX "_WorkerStores_B_index" ON "_WorkerStores"("B");

-- AddForeignKey
ALTER TABLE "Wage" ADD CONSTRAINT "Wage_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wage" ADD CONSTRAINT "Wage_workShiftId_fkey" FOREIGN KEY ("workShiftId") REFERENCES "WorkShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkerStores" ADD CONSTRAINT "_WorkerStores_A_fkey" FOREIGN KEY ("A") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkerStores" ADD CONSTRAINT "_WorkerStores_B_fkey" FOREIGN KEY ("B") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
