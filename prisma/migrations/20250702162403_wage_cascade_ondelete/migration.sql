-- DropForeignKey
ALTER TABLE "Wage" DROP CONSTRAINT "Wage_workShiftId_fkey";

-- AddForeignKey
ALTER TABLE "Wage" ADD CONSTRAINT "Wage_workShiftId_fkey" FOREIGN KEY ("workShiftId") REFERENCES "WorkShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
