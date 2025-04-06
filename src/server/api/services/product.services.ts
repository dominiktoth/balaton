import { db } from '~/server/db';
import { type Product } from '@prisma/client';

export const productService = {
  createProduct: async (name: string, price: number, stock: number, storeId: string): Promise<Product> => {
    return db.product.create({
      data: { name, price, stock, storeId },
    });
  },
  // Add other product-related methods as needed
};
