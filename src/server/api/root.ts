import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { storeRouter } from "./routers/stores.router";
import { productRouter } from "./routers/product.router";
import { expenseRouter } from "./routers/expense.router";
import { orderRouter } from "./routers/order.router";
import { userRouter } from "./routers/user.router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  store: storeRouter,
  product: productRouter,
  expense: expenseRouter,
  order: orderRouter,
  user:userRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
