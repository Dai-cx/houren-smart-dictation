import { z } from "zod";
import { router, publicProcedure } from "../trpc/trpc";
import { dictationResults } from "../db/schema";
import { eq } from "drizzle-orm";

export const resultRouter = router({
  listByStudent: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(dictationResults)
        .where(eq(dictationResults.studentId, input))
        .all();
    }),

  listByExercise: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(dictationResults)
        .where(eq(dictationResults.exerciseId, input))
        .all();
    }),

  submit: publicProcedure
    .input(
      z.object({
        studentId: z.number(),
        exerciseId: z.number(),
        submittedContent: z.string(),
        durationSeconds: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { submittedContent, studentId, exerciseId, durationSeconds } =
        input;

      // Compare submitted content against expected content
      const exercise = await ctx.db.query.dictationExercises.findFirst({
        where: eq(dictationResults.exerciseId, exerciseId),
      });

      const expectedContent = exercise?.content ?? "";
      const expectedChars = [...expectedContent.replace(/\s/g, "")];
      const submittedChars = [...submittedContent.replace(/\s/g, "")];

      const totalCount = expectedChars.length;
      let correctCount = 0;
      const errors: { position: number; expected: string; got: string }[] = [];

      for (let i = 0; i < totalCount; i++) {
        if (submittedChars[i] === expectedChars[i]) {
          correctCount++;
        } else {
          errors.push({
            position: i,
            expected: expectedChars[i],
            got: submittedChars[i] ?? "",
          });
        }
      }

      const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

      return ctx.db
        .insert(dictationResults)
        .values({
          studentId,
          exerciseId,
          submittedContent,
          correctCount,
          totalCount,
          accuracy: Math.round(accuracy * 100) / 100,
          durationSeconds: durationSeconds ?? null,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
        })
        .returning()
        .get();
    }),
});
