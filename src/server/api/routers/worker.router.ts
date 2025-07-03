import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { createWorker, getWorkers, getWorkerById, deleteWorker, getWorkersByStore, updateWorker } from '../services/worker.services';
import { db } from "~/server/db";

export const workerRouter = createTRPCRouter({
  createWorker: protectedProcedure
    .input(z.object({ name: z.string(), storeIds: z.array(z.string()), dailyWage: z.number().optional() }))
    .mutation(async ({ input }) => {
      return createWorker({ name: input.name, storeIds: input.storeIds, dailyWage: input.dailyWage });
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
    .input(z.object({ id: z.string(), name: z.string(), storeIds: z.array(z.string()), dailyWage: z.number().optional() }))
    .mutation(async ({ input }) => {
      return updateWorker({ id: input.id, name: input.name, storeIds: input.storeIds, dailyWage: input.dailyWage });
    }),

  getAllWages: protectedProcedure.query(async () => {
    return db.wage.findMany({
      select: {
        id: true,
        amount: true,
        date: true,
        workerId: true,
        workShift: {
          select: {
            storeId: true,
            note: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
  }),
}); 