// /server/api/routers/user.ts
import { z } from "zod";

import { createClient } from "@supabase/supabase-js";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "~/server/db";
import { supabase } from "~/server/auth/supabaseClient";
import { randomUUID } from "crypto";

export const userRouter = createTRPCRouter({
  createUser: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.string().optional(),
        storeId: z.string().optional(),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { email, password, role, name, storeId } = input;
      const user = await db.user.create({
        data: {
          id: randomUUID(),
          email,
          name: name ?? null,
          role,
          storeId: storeId,
        },
      });

      return user;
    }),

  getAll: publicProcedure.query(() =>
    db.user.findMany({
      include: {
        store: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ),
  getById: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(({ input }) => db.user.findUnique({ where: { email: input.email } })),


    getByEmail: publicProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ input }) => {
      console.log(input.email, "api call");
      return await db.user.findUnique({ where: { email: input.email } ,include: { store: true }});
    }),
});
