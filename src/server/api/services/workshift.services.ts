import { db } from '../../db';

export async function createWorkShift({ workerId, storeId, date, note }: { workerId: string; storeId: string; date: Date; note?: string }) {
  // Tranzakcióban hozzuk létre a WorkShift-et és a Wage-et
  return db.$transaction(async (tx) => {
    // WorkShift létrehozása
    const workShift = await tx.workShift.create({
      data: { workerId, storeId, date, note },
    });

    // Lekérjük a dolgozó napi bérét
    const worker = await tx.worker.findUnique({
      where: { id: workerId },
      select: { dailyWage: true },
    });

    // Ha van napi bér, létrehozzuk a Wage rekordot
    let wage = null;
    if (worker?.dailyWage) {
      wage = await tx.wage.create({
        data: {
          workerId,
          workShiftId: workShift.id,
          date,
          amount: worker.dailyWage,
        },
      });
      // Frissítjük a WorkShift-et, hogy kapcsolódjon a Wage-hez
      await tx.workShift.update({
        where: { id: workShift.id },
        data: { wageId: wage.id },
      });
    }

    // Visszaadjuk a WorkShift-et és a Wage-et is
    return { workShift, wage };
  });
}

export async function getWorkShiftsByStoreAndDate(storeId: string, date: Date) {
  if (!date || isNaN(date.getTime())) return [];
  return db.workShift.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      date,
    },
    include: { worker: true },
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
  return db.workShift.delete({
    where: { id },
  });
} 