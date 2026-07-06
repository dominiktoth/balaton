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

export async function getWorkers(strandSlug?: string) {
  return db.worker.findMany({
    where: strandSlug
      ? { stores: { some: { strand: { slug: strandSlug } } } }
      : undefined,
    orderBy: { name: 'asc' },
    include: { stores: true, advances: { orderBy: { date: 'desc' } } },
  });
}

export async function getWorkerById(workerId: string) {
  return db.worker.findUnique({
    where: { id: workerId },
    include: { stores: true },
  });
}

export async function deleteWorker(workerId: string) {
  return db.$transaction(async (tx) => {
    // Wage.workShift has onDelete: Cascade, so deleting the workshifts
    // cleans up most wages. But Wage.workerId is required and has no
    // cascade from Worker, so any wage without a workshift would block
    // the worker delete. Wipe everything tied to the worker explicitly.
    await tx.wage.deleteMany({ where: { workerId } });
    await tx.workShift.deleteMany({ where: { workerId } });
    await tx.advance.deleteMany({ where: { workerId } });
    return tx.worker.delete({ where: { id: workerId } });
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