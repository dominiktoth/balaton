import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { createWorker, getWorkers, getWorkerById, deleteWorker, getWorkersByStore, updateWorker } from '../services/worker.services';

export const workerRouter = createTRPCRouter({
  createWorker: protectedProcedure
    .input(z.object({ name: z.string(), storeId: z.string() }))
    .mutation(async ({ input }) => {
      return createWorker({ name: input.name, storeId: input.storeId });
    }),

  getWorkers: protectedProcedure.query(async () => {
    return getWorkers();
  }),

  getWorkerById: protectedProcedure
    .input(z.object({ workerId: z.string() }))
    .query(async ({ input }) => {
      return getWorkerById(input.workerId);
    }),

  deleteWorker: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteWorker(input.id);
    }),

  getWorkersByStore: protectedProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ input }) => {
      return getWorkersByStore(input.storeId);
    }),

  updateWorker: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string(), storeId: z.string() }))
    .mutation(async ({ input }) => {
      return updateWorker({ id: input.id, name: input.name, storeId: input.storeId });
    }),
}); 