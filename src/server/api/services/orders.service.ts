import { db } from '~/server/db';
import { type Order, type OrderItem } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

interface CreateOrderInput {
  storeId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  total: number;
}

export async function createOrder(orderData: CreateOrderInput): Promise<Order> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        storeId: orderData.storeId,
        total: orderData.total,
        OrderItem: {
          createMany: {
            data: orderData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      },
      include: {
        OrderItem: true,
      }
    });

    // Update product stock
    for (const item of orderData.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    return order;
  });
}

export async function getOrdersByStore(storeId: string): Promise<number> {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const orders = await db.order.findMany({
      where: {
        storeId: storeId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const total = orders.reduce((sum, order) => sum + order.total, 0);
    return total;
  }