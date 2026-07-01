import { router } from "../trpc/trpc";
import { studentRouter } from "./student";
import { dictationRouter } from "./dictation";
import { resultRouter } from "./result";

export const appRouter = router({
  student: studentRouter,
  dictation: dictationRouter,
  result: resultRouter,
});

export type AppRouter = typeof appRouter;
