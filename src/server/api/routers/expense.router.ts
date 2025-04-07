import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { createExpense, deleteExpense, getAllExpenses } from '../services/expenses.services';

export const expenseRouter = createTRPCRouter({
  createExpense: protectedProcedure
    .input(z.object({
      amount: z.number(),
      storeId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return createExpense(input.amount, input.storeId);
    }),

  getAllExpenses: protectedProcedure.query(async () => {
    return getAllExpenses();
  }),

  deleteExpense: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteExpense(input.id);
    }),
});
