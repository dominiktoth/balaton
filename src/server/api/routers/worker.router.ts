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

  getWorkers: protectedProcedure
    .input(z.object({ strandSlug: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getWorkers(input?.strandSlug);
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

  getAllWages: protectedProcedure
    .input(z.object({ strandSlug: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return db.wage.findMany({
        where: input?.strandSlug
          ? { workShift: { store: { strand: { slug: input.strandSlug } } } }
          : undefined,
        select: {
          id: true,
          amount: true,
          date: true,
          workerId: true,
          paid: true,
          paidAt: true,
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

  setWagePaid: protectedProcedure
    .input(z.object({ id: z.string(), paid: z.boolean() }))
    .mutation(async ({ input }) => {
      return db.wage.update({
        where: { id: input.id },
        data: {
          paid: input.paid,
          paidAt: input.paid ? new Date() : null,
        },
      });
    }),
});
