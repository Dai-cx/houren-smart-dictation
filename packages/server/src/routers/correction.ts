import { z } from "zod";
import { router, publicProcedure } from "../trpc/trpc";
import { analyzeDictationErrors } from "../lib/alibaba-qwen";

export const correctionRouter = router({
  analyze: publicProcedure
    .input(
      z.object({
        words: z.array(z.string()),
        recognizedText: z.string(),
        errors: z.array(
          z.object({
            expected: z.string(),
            actual: z.string(),
          }),
        ),
        ossImageUrl: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await analyzeDictationErrors(
        input.words,
        input.recognizedText,
        input.errors,
        input.ossImageUrl,
      );
      return result;
    }),
});
