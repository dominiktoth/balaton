/*
  Warnings:

  - You are about to drop the column `hours` on the `WorkShift` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WorkShift" DROP COLUMN "hours";

-- AlterTable
ALTER TABLE "Worker" ADD COLUMN     "storeId" TEXT;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
