import { z } from "zod";
import { router, publicProcedure } from "../trpc/trpc";
import { synthesizeSpeech } from "../lib/alibaba-tts";

export const ttsRouter = router({
  synthesize: publicProcedure
    .input(
      z.object({
        text: z.string().min(1).max(500),
        voice: z.string().optional().default("xiaoyun"),
        speechRate: z.number().min(-500).max(500).optional().default(0),
        volume: z.number().min(0).max(100).optional().default(50),
        format: z.enum(["mp3", "wav"]).optional().default("mp3"),
      }),
    )
    .query(async ({ input }) => {
      const audioBuffer = await synthesizeSpeech(input.text, {
        voice: input.voice,
        speechRate: input.speechRate,
        volume: input.volume,
        format: input.format,
      });

      return {
        audioBase64: audioBuffer.toString("base64"),
        format: input.format ?? "mp3",
      };
    }),
});
