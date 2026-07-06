import { db } from '../../db';
import { coverWageFromAdvances, refundWageAdvance } from './advance.services';

export async function createWorkShift({
  workerId,
  storeId,
  date,
  note,
  amount,
}: {
  workerId: string;
  storeId: string;
  date: Date;
  note?: string;
  amount?: number;
}) {
  return db.$transaction(async (tx) => {
    const workShift = await tx.workShift.create({
      data: { workerId, storeId, date, note },
    });

    // Choose wage amount: explicit param wins, else fall back to worker.dailyWage
    let wageAmount = amount;
    if (wageAmount === undefined) {
      const worker = await tx.worker.findUnique({
        where: { id: workerId },
        select: { dailyWage: true },
      });
      wageAmount = worker?.dailyWage ?? undefined;
    }

    let wage = null;
    if (wageAmount && wageAmount > 0) {
      wage = await tx.wage.create({
        data: {
          workerId,
          workShiftId: workShift.id,
          date,
          amount: wageAmount,
        },
      });
      await tx.workShift.update({
        where: { id: workShift.id },
        data: { wageId: wage.id },
      });
      // If the worker has an open advance, it covers this day automatically
      await coverWageFromAdvances(tx, workerId, wage.id);
      wage = await tx.wage.findUnique({ where: { id: wage.id } });
    }

    return { workShift, wage };
  });
}

export async function getAllWorkShifts(strandSlug?: string) {
  return db.workShift.findMany({
    where: strandSlug ? { store: { strand: { slug: strandSlug } } } : undefined,
    orderBy: { date: 'desc' },
    include: { worker: true, store: true },
  });
}

export async function getWorkShiftsByStoreAndDate(storeId: string, date: Date) {
  if (!date || isNaN(date.getTime())) return [];
  return db.workShift.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      date,
    },
    include: { worker: true, wage: true },
  });
}

export async function getWorkShiftsForStoreAndDateAllWorkers(storeId: string, date: Date) {
  return db.workShift.findMany({
    where: {
      storeId,
      date,
    },
    include: { worker: true },
  });
}

export async function getWorkShiftsByWorker(workerId: string) {
  return db.workShift.findMany({
    where: { workerId },
    orderBy: { date: 'desc' },
    include: { store: true },
  });
}

export async function deleteWorkShift(id: string) {
  return db.$transaction(async (tx) => {
    // If this shift's wage was covered from an advance, give that cover back
    const wage = await tx.wage.findUnique({ where: { workShiftId: id } });
    if (wage && wage.advanceConsumed > 0) {
      await refundWageAdvance(tx, wage.workerId, wage.advanceConsumed);
    }
    return tx.workShift.delete({
      where: { id },
    });
  });
} 