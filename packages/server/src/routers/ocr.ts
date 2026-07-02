import { z } from "zod";
import { router, publicProcedure } from "../trpc/trpc";
import { recognizeImage } from "../lib/alibaba-ocr";

export const ocrRouter = router({
  recognize: publicProcedure
    .input(
      z.object({
        imageBase64: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const recognizedText = await recognizeImage(input.imageBase64);
      return { recognizedText };
    }),
});
