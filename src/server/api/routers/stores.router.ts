// store.router.ts
import { z } from 'zod';
import { createStore, deleteStore, getAllStores } from '../services/stores.service';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const storeRouter = createTRPCRouter({
  createStore: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      return createStore(input.name);
    }),
  getAllStores: protectedProcedure.query(async () => {
    return getAllStores();
  }),
    deleteStore: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
        return deleteStore(input.id);
        }),
  // Define other procedures and link them to service methods here
});
