import { db } from '../../db';

export async function createWorker({ name }: { name: string }) {
  return db.worker.create({
    data: { name },
  });
}

export async function getWorkers() {
  return db.worker.findMany({
    orderBy: { name: 'asc' },
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