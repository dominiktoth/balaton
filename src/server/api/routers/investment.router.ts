import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  createInvestment,
  deleteInvestment,
  getAllInvestments,
  updateInvestment,
} from '../services/investment.services';

export const investmentRouter = createTRPCRouter({
  createInvestment: protectedProcedure
    .input(z.object({
      amount: z.number(),
      storeId: z.string(),
      date: z.string().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createInvestment(
        input.amount,
        input.storeId,
        input.date ? new Date(input.date) : undefined,
        input.note,
      );
    }),

  getAllInvestments: protectedProcedure
    .input(z.object({ strandSlug: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getAllInvestments(input?.strandSlug);
    }),

  updateInvestment: protectedProcedure
    .input(z.object({ id: z.string(), amount: z.number(), date: z.string(), note: z.string().optional() }))
    .mutation(async ({ input }) => {
      return updateInvestment(input.id, input.amount, new Date(input.date), input.note);
    }),

  deleteInvestment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteInvestment(input.id);
    }),
});
