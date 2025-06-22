import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { createExpense, deleteExpense, getAllExpenses, updateExpense } from '../services/expenses.services';

export const expenseRouter = createTRPCRouter({
  createExpense: protectedProcedure
    .input(z.object({
      amount: z.number(),
      storeId: z.string(),
      date: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createExpense(input.amount, input.storeId, input.date ? new Date(input.date) : undefined);
    }),

  getAllExpenses: protectedProcedure.query(async () => {
    return getAllExpenses();
  }),

  deleteExpense: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteExpense(input.id);
    }),

  updateExpense: protectedProcedure
    .input(z.object({ id: z.string(), amount: z.number(), date: z.string() }))
    .mutation(async ({ input }) => {
      return updateExpense(input.id, input.amount, new Date(input.date));
    }),
});
