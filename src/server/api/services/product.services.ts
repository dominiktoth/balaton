import { db } from '~/server/db';
import { type Product } from '@prisma/client';

export const productService = {
  createProduct: async (
    id: string | undefined,
    name: string,
    price: number,
    imageUrl: string,
    stock: number,
    storeId: string
  ): Promise<Product> => {
    return db.product.upsert({
      where: { id: id || '' },
      create: {
        name,
        price,
        imageUrl,
        stock,
        storeId,
      },
      update: {
        name,
        price,
        imageUrl,
        stock,
        storeId,
      },
    });
  },

  

  deleteProduct: async (id: string): Promise<Product> => {
    return db.product.delete({
      where: { id },
    });
  },
};


export const getAllProducts = async (
  storeId?: string,
  search?: string
): Promise<(Product & { store: { name: string } })[]> => {
  const whereClause: any = {
    storeId: storeId,
  };

  if (search) {
    whereClause.name = {
      contains: search,
      mode: "insensitive", // Case-insensitive search
    };
  }

  return db.product.findMany({
    where: whereClause,
    include: {
      store: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};