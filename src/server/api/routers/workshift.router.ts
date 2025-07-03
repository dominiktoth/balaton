import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { createWorkShift, getWorkShiftsByStoreAndDate, getWorkShiftsByWorker, deleteWorkShift, getWorkShiftsForStoreAndDateAllWorkers } from '../services/workshift.services';

export const workshiftRouter = createTRPCRouter({
  createWorkShift: protectedProcedure
    .input(z.object({
      workerId: z.string(),
      storeId: z.string(),
      date: z.string(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createWorkShift({
        workerId: input.workerId,
        storeId: input.storeId,
        date: new Date(input.date),
        note: input.note,
      });
    }),

  getWorkShiftsByStoreAndDate: protectedProcedure
    .input(z.object({ storeId: z.string(), date: z.string() }))
    .query(async ({ input }) => {
      return getWorkShiftsByStoreAndDate(input.storeId, new Date(input.date));
    }),

  getWorkShiftsByWorker: protectedProcedure
    .input(z.object({ workerId: z.string() }))
    .query(async ({ input }) => {
      return getWorkShiftsByWorker(input.workerId);
    }),

  deleteWorkShift: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteWorkShift(input.id);
    }),

  getWorkShiftsForStoreAndDateAllWorkers: protectedProcedure
    .input(z.object({ storeId: z.string(), date: z.string() }))
    .query(async ({ input }) => {
      return getWorkShiftsForStoreAndDateAllWorkers(input.storeId, new Date(input.date));
    }),
}); 