import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { getAllStrands, getStrandBySlug } from '../services/strand.service';

export const strandRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async () => {
    return getAllStrands();
  }),
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return getStrandBySlug(input.slug);
    }),
});
