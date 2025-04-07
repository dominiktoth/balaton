import { db } from '~/server/db';
import { type Product } from '@prisma/client';

export const productService = {
  createProduct: async (
    name: string,
    price: number,
    stock: number,
    storeId: string
  ): Promise<Product> => {
    return db.product.create({
      data: {
        name,
        price,
        stock,
        storeId,
      },
    });
  },

  getAllProducts: async (): Promise<(Product & { store: { name: string } })[]> => {
    return db.product.findMany({
      include: {
        store: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  deleteProduct: async (id: string): Promise<Product> => {
    return db.product.delete({
      where: { id },
    });
  },
};
