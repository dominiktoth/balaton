import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { getAllProducts, productService } from '../services/product.services';

export const productRouter = createTRPCRouter({
  createProduct: protectedProcedure
    .input(z.object({
      id: z.string().optional(),
      name: z.string(),
      price: z.number(),
      imageUrl: z.string(),
      stock: z.number(),
      storeId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return productService.createProduct(
        input.id,
        input.name,
        input.price,
        input.imageUrl,
        input.stock,
        input.storeId,
      );
    }),
    getAllProducts: protectedProcedure
    .input(
      z.object({
        store: z.string().optional(),
        search: z.string().optional(), // Add search parameter
      }).optional()
    )
    .query(async ({ input }) => {
      return getAllProducts(input?.store, input?.search); // Pass search to the service
    }),

  deleteProduct: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return productService.deleteProduct(input.id);
    }),
});
