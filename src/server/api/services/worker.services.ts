import { db } from '../../db';

export async function createWorker({ name, storeId }: { name: string, storeId: string }) {
  return db.worker.create({
    data: { name, storeId },
  });
}

export async function getWorkers() {
  return db.worker.findMany({
    orderBy: { name: 'asc' },
    include: { store: true },
  });
}

export async function getWorkerById(workerId: string) {
  return db.worker.findUnique({
    where: { id: workerId },
  });
}

export async function deleteWorker(workerId: string) {
  return db.worker.delete({
    where: { id: workerId },
  });
}

export async function getWorkersByStore(storeId: string) {
  return db.worker.findMany({
    where: { storeId },
    orderBy: { name: 'asc' },
  });
}

export async function updateWorker({ id, name, storeId }: { id: string; name: string; storeId: string }) {
  return db.worker.update({
    where: { id },
    data: { name, storeId },
  });
} 