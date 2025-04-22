import { z } from 'zod';
import { createOrder, getOrdersByStore } from '../services/orders.service';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const orderRouter = createTRPCRouter({
  createOrder: protectedProcedure
    .input(z.object({
      storeId: z.string(),
      items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().positive()
      })),
      total: z.number().positive()
    }))
    .mutation(async ({ input }) => {
      return createOrder(input);
    }),

  getStoreOrders: protectedProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ input }) => {
      return getOrdersByStore(input.storeId);
    }),
});