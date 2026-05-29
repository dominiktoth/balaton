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

  updateWageAmount: protectedProcedure
    .input(z.object({ id: z.string(), amount: z.number().nonnegative() }))
    .mutation(async ({ input }) => {
      return db.wage.update({
        where: { id: input.id },
        data: { amount: input.amount },
      });
    }),

  upsertWageForWorkshift: protectedProcedure
    .input(
      z.object({
        workShiftId: z.string(),
        workerId: z.string(),
        amount: z.number().nonnegative(),
        date: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await db.wage.findUnique({
        where: { workShiftId: input.workShiftId },
      });
      if (existing) {
        return db.wage.update({
          where: { id: existing.id },
          data: { amount: input.amount },
        });
      }
      const wage = await db.wage.create({
        data: {
          workerId: input.workerId,
          workShiftId: input.workShiftId,
          date: new Date(input.date),
          amount: input.amount,
        },
      });
      await db.workShift.update({
        where: { id: input.workShiftId },
        data: { wageId: wage.id },
      });
      return wage;
    }),

  payAllPending: protectedProcedure
    .input(
      z.object({
        workerId: z.string(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const where = {
        workerId: input.workerId,
        paid: false,
        ...(input.dateFrom || input.dateTo
          ? {
              date: {
                ...(input.dateFrom ? { gte: new Date(input.dateFrom) } : {}),
                ...(input.dateTo
                  ? { lte: new Date(new Date(input.dateTo).getTime() + 86_400_000 - 1) }
                  : {}),
              },
            }
          : {}),
      };
      const pending = await db.wage.findMany({
        where,
        select: { amount: true },
      });
      const totalAmount = pending.reduce((s, w) => s + w.amount, 0);
      const result = await db.wage.updateMany({
        where,
        data: { paid: true, paidAt: new Date() },
      });
      return { count: result.count, totalAmount };
    }),
});
