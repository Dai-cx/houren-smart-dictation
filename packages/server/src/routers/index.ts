import { router } from "../trpc/trpc";
import { studentRouter } from "./student";
import { dictationRouter } from "./dictation";
import { resultRouter } from "./result";
import { ttsRouter } from "./tts";
import { ocrRouter } from "./ocr";
import { correctionRouter } from "./correction";

export const appRouter = router({
  student: studentRouter,
  dictation: dictationRouter,
  result: resultRouter,
  tts: ttsRouter,
  ocr: ocrRouter,
  correction: correctionRouter,
});

export type AppRouter = typeof appRouter;
