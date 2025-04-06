// store.router.ts
import { z } from 'zod';
import { createStore, deleteStore, getAllStores } from '../services/stores.service';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const storeRouter = createTRPCRouter({
  createStore: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      return createStore(input.name);
    }),
  getAllStores: publicProcedure.query(async () => {
    return getAllStores();
  }),
    deleteStore: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
        return deleteStore(input.id);
        }),
  // Define other procedures and link them to service methods here
});
