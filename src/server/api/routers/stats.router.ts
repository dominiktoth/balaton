import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { getStatsData, getStatsOpening } from '../services/stats.services';

const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD formátum szükséges');

const startOfDay = (key: string) => new Date(`${key}T00:00:00.000Z`);
const endOfDay = (key: string) => new Date(`${key}T23:59:59.999Z`);

export const statsRouter = createTRPCRouter({
  getStats: protectedProcedure
    .input(
      z.object({
        strandSlug: z.string(),
        from: dayKey,
        to: dayKey,
      }),
    )
    .query(async ({ input }) => {
      return getStatsData({
        strandSlug: input.strandSlug,
        from: startOfDay(input.from),
        to: endOfDay(input.to),
      });
    }),

  getOpening: protectedProcedure
    .input(z.object({ strandSlug: z.string(), before: dayKey }))
    .query(async ({ input }) => {
      return getStatsOpening({
        strandSlug: input.strandSlug,
        before: startOfDay(input.before),
      });
    }),
});
