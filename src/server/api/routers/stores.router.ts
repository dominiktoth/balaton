// store.router.ts
import { z } from 'zod';
import { createStore, deleteStore, getAllStores } from '../services/stores.service';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const storeRouter = createTRPCRouter({
  createStore: protectedProcedure
    .input(z.object({ name: z.string(), strandId: z.string() }))
    .mutation(async ({ input }) => {
      return createStore(input.name, input.strandId);
    }),
  getAllStores: protectedProcedure
    .input(z.object({ strandSlug: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getAllStores(input?.strandSlug);
    }),
  deleteStore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return deleteStore(input.id);
    }),
});
