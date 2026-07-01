import { z } from "zod";
import { router, publicProcedure } from "../trpc/trpc";
import { dictationExercises } from "../db/schema";
import { eq } from "drizzle-orm";

export const dictationRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          gradeLevel: z.number().min(1).max(6).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (input?.gradeLevel) {
        return ctx.db
          .select()
          .from(dictationExercises)
          .where(eq(dictationExercises.gradeLevel, input.gradeLevel))
          .all();
      }
      return ctx.db.select().from(dictationExercises).all();
    }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(dictationExercises)
        .where(eq(dictationExercises.id, input))
        .get();
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        description: z.string().optional(),
        gradeLevel: z.number().min(1).max(6).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const wordCount = input.content.replace(/\s/g, "").length;
      return ctx.db
        .insert(dictationExercises)
        .values({ ...input, wordCount })
        .returning()
        .get();
    }),
});
