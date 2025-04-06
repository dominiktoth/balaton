import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { productService } from '../services/product.services';

export const productRouter = createTRPCRouter({
  createProduct: publicProcedure
    .input(z.object({
      name: z.string(),
      price: z.number(),
      stock: z.number(),
      storeId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return productService.createProduct(input.name, input.price, input.stock, input.storeId);
    }),
  // Define other product-related procedures here
});
