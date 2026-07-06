import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { createWorker, getWorkers, getWorkerById, deleteWorker, getWorkersByStore, updateWorker } from '../services/worker.services';
import { coverWageFromAdvances, refundWageAdvance, createAdvance, deleteAdvance } from '../services/advance.services';
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
          paidAmount: true,
          advanceConsumed: true,
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
      return db.$transaction(async (tx) => {
        const wage = await tx.wage.findUnique({ where: { id: input.id } });
        if (!wage) throw new Error('A bér nem található.');
        if (input.paid) {
          return tx.wage.update({
            where: { id: input.id },
            data: {
              paid: true,
              paidAt: new Date(),
              paidAmount: wage.amount,
            },
          });
        }
        // Unpay: give any advance-sourced cover back to the advances
        if (wage.advanceConsumed > 0) {
          await refundWageAdvance(tx, wage.workerId, wage.advanceConsumed);
        }
        return tx.wage.update({
          where: { id: input.id },
          data: {
            paid: false,
            paidAt: null,
            paidAmount: 0,
            advanceConsumed: 0,
          },
        });
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
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return db.$transaction(async (tx) => {
        // Always sync the workshift's note when the field is provided
        // (empty string -> clears the note).
        if (input.note !== undefined) {
          await tx.workShift.update({
            where: { id: input.workShiftId },
            data: { note: input.note === "" ? null : input.note },
          });
        }
        const existing = await tx.wage.findUnique({
          where: { workShiftId: input.workShiftId },
        });
        if (existing) {
          // If shrinking below what's already covered, refund the excess
          // advance cover so the advance balance stays truthful.
          let paidAmount = existing.paidAmount;
          let advanceConsumed = existing.advanceConsumed;
          if (paidAmount > input.amount) {
            const excess = paidAmount - input.amount;
            const refund = Math.min(excess, advanceConsumed);
            if (refund > 0) {
              await refundWageAdvance(tx, existing.workerId, refund);
              advanceConsumed -= refund;
            }
            paidAmount = input.amount;
          }
          const fullyPaid = paidAmount >= input.amount;
          const updated = await tx.wage.update({
            where: { id: existing.id },
            data: {
              amount: input.amount,
              paidAmount,
              advanceConsumed,
              paid: fullyPaid,
              paidAt: fullyPaid ? (existing.paidAt ?? new Date()) : null,
            },
          });
          // If the amount grew and there's an open advance, cover the increase
          await coverWageFromAdvances(tx, existing.workerId, existing.id);
          return tx.wage.findUnique({ where: { id: updated.id } });
        }
        const wage = await tx.wage.create({
          data: {
            workerId: input.workerId,
            workShiftId: input.workShiftId,
            date: new Date(input.date),
            amount: input.amount,
          },
        });
        await tx.workShift.update({
          where: { id: input.workShiftId },
          data: { wageId: wage.id },
        });
        await coverWageFromAdvances(tx, input.workerId, wage.id);
        return tx.wage.findUnique({ where: { id: wage.id } });
      });
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
      return db.$transaction(async (tx) => {
        const pending = await tx.wage.findMany({ where });
        // Only the uncovered part counts as cash handed over now
        const totalAmount = pending.reduce(
          (s, w) => s + Math.max(0, w.amount - w.paidAmount),
          0,
        );
        const now = new Date();
        for (const w of pending) {
          await tx.wage.update({
            where: { id: w.id },
            data: { paid: true, paidAt: now, paidAmount: w.amount },
          });
        }
        return { count: pending.length, totalAmount };
      });
    }),

  createAdvance: protectedProcedure
    .input(
      z.object({
        workerId: z.string(),
        amount: z.number().positive(),
        date: z.string(),
        note: z.string().optional(),
        dateFrom: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return createAdvance({
        workerId: input.workerId,
        amount: input.amount,
        date: new Date(input.date),
        note: input.note,
        dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
      });
    }),

  deleteAdvance: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteAdvance(input.id);
    }),
});
