import { db } from '../../db';

export async function createWorker({ name, storeIds, dailyWage }: { name: string, storeIds: string[], dailyWage?: number }) {
  return db.worker.create({
    data: {
      name,
      dailyWage,
      stores: {
        connect: storeIds.map(id => ({ id })),
      },
    },
    include: { stores: true },
  });
}

export async function getWorkers() {
  return db.worker.findMany({
    orderBy: { name: 'asc' },
    include: { stores: true },
  });
}

export async function getWorkerById(workerId: string) {
  return db.worker.findUnique({
    where: { id: workerId },
    include: { stores: true },
  });
}

export async function deleteWorker(workerId: string) {
  return db.worker.delete({
    where: { id: workerId },
  });
}

export async function getWorkersByStore(storeId: string) {
  return db.worker.findMany({
    where: { stores: { some: { id: storeId } } },
    orderBy: { name: 'asc' },
    include: { stores: true },
  });
}

export async function updateWorker({ id, name, storeIds, dailyWage }: { id: string; name: string; storeIds: string[]; dailyWage?: number }) {
  return db.worker.update({
    where: { id },
    data: {
      name,
      dailyWage,
      stores: {
        set: storeIds.map(id => ({ id })),
      },
    },
    include: { stores: true },
  });
} 