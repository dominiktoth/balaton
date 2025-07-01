import { db } from '../../db';

export async function createWorkShift({ workerId, storeId, date }: { workerId: string; storeId: string; date: Date }) {
  return db.workShift.create({
    data: { workerId, storeId, date },
  });
}

export async function getWorkShiftsByStoreAndDate(storeId: string, date: Date) {
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