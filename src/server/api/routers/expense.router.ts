import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { createExpense, deleteExpense, getAllExpenses } from '../services/expenses.services';

export const expenseRouter = createTRPCRouter({
  createExpense: publicProcedure
    .input(z.object({
      amount: z.number(),
      storeId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return createExpense(input.amount, input.storeId);
    }),

  getAllExpenses: publicProcedure.query(async () => {
    return getAllExpenses();
  }),

  deleteExpense: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteExpense(input.id);
    }),
});
