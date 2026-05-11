import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { createIncome, getIncomesByStore, getIncomeSummaryByStore, getAllIncomes, updateIncome, deleteIncome } from '../services/income.services';

export const incomeRouter = createTRPCRouter({
  createIncome: protectedProcedure
    .input(z.object({
      amount: z.number(),
      date: z.string(),
      storeId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return createIncome({
        amount: input.amount,
        date: new Date(input.date),
        storeId: input.storeId,
      });
    }),

  getIncomesByStore: protectedProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ input }) => {
      return getIncomesByStore(input.storeId);
    }),

  getAllIncomes: protectedProcedure
    .input(z.object({ strandSlug: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getAllIncomes(input?.strandSlug);
    }),

  getIncomeSummaryByStore: protectedProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ input }) => {
      return getIncomeSummaryByStore(input.storeId);
    }),

  updateIncome: protectedProcedure
    .input(z.object({ id: z.string(), amount: z.number(), date: z.string() }))
    .mutation(async ({ input }) => {
      return updateIncome(input.id, input.amount, new Date(input.date));
    }),

  deleteIncome: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteIncome(input.id);
    }),
}); 