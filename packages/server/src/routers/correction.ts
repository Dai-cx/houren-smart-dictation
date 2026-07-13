import { z } from "zod";
import { router, publicProcedure } from "../trpc/trpc";
import { gradeByComponents } from "../lib/alibaba-qwen";
import type { CorrectionAnalysis } from "@smart-dictation/shared";

export const correctionRouter = router({
  /** 部件级视觉批改：AI 拆解部件 → 后端字符串比对 → 只判断正误 */
  analyze: publicProcedure
    .input(
      z.object({
        ossImageUrl: z.string().url(),
        words: z.array(z.string().min(1)).min(1),
      }),
    )
    .mutation(async ({ input }): Promise<CorrectionAnalysis> => {
      console.log("[correction] 开始部件级批改, 词表:", input.words);

      const result = await gradeByComponents({
        imageUrl: input.ossImageUrl,
        words: input.words,
      });

      const s = result.summary;
      console.log(
        `[correction] 结果: ${s.correctChars}/${s.totalChars} 正确, 正确率 ${s.accuracyRate}%, ${s.errorCount} 处错误${result.anomalous ? " ⚠️异常" : ""}`,
      );

      return { result };
    }),
});
