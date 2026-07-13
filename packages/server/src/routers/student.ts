import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc/trpc";
import { students } from "../db/schema";
import { eq } from "drizzle-orm";

export const studentRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(students).all();
  }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(students).where(eq(students.id, input)).get();
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        className: z.string().optional(),
        studentNo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return ctx.db.insert(students).values(input).returning().get();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("UNIQUE constraint") || message.includes("student_no")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "该学号已存在",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "创建学生失败",
        });
      }
    }),
});
