import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { productService } from '../services/product.services';

export const productRouter = createTRPCRouter({
  createProduct: protectedProcedure
    .input(z.object({
      name: z.string(),
      price: z.number(),
      stock: z.number(),
      storeId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return productService.createProduct(
        input.name,
        input.price,
        input.stock,
        input.storeId
      );
    }),

  getAllProducts: protectedProcedure.query(async () => {
    return productService.getAllProducts();
  }),

  deleteProduct: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return productService.deleteProduct(input.id);
    }),
});
