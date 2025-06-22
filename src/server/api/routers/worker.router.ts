import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { createWorker, getWorkers, getWorkerById, deleteWorker } from '../services/worker.services';

export const workerRouter = createTRPCRouter({
  createWorker: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      return createWorker({ name: input.name });
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
}); 