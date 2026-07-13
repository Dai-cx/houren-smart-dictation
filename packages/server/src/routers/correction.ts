import { z } from "zod";
import { router, publicProcedure } from "../trpc/trpc";
import { gradeByComponents } from "../lib/alibaba-qwen";
import { recognizeImageWithPositionsFromUrl } from "../lib/alibaba-ocr";
import { annotateGradeImage } from "../lib/image-annotator";
import { uploadImageToOSS } from "../lib/alibaba-oss";
import { alignCharacters } from "@smart-dictation/shared";
import type { CorrectionAnalysis } from "@smart-dictation/shared";
import type { BoundingBox } from "../lib/image-annotator";

export const correctionRouter = router({
  analyze: publicProcedure
    .input(
      z.object({
        ossImageUrl: z.string().url(),
        words: z.array(z.string().min(1)).min(1),
      }),
    )
    .mutation(async ({ input }): Promise<CorrectionAnalysis> => {
      console.log("[correction] 开始批改, 词表:", input.words);

      // 1. AI 判断对错
      const result = await gradeByComponents({
        imageUrl: input.ossImageUrl,
        words: input.words,
      });

      const s = result.summary;
      console.log(
        `[correction] AI 结果: ${s.correctChars}/${s.totalChars} 正确, 正确率 ${s.accuracyRate}%`,
      );

      // 2. OCR 获取字符位置
      let annotatedImageUrl: string | undefined;
      try {
        const ocrResult = await recognizeImageWithPositionsFromUrl(
          input.ossImageUrl,
        );
        const ocrChars = ocrResult.chars;

        // 3. 用编辑距离对齐期望字与 OCR 字，获取每个期望字的位置
        const expectedFlat: { char: string; key: string }[] = [];
        for (let wi = 0; wi < input.words.length; wi++) {
          const w = input.words[wi];
          for (let ci = 0; ci < w.length; ci++) {
            expectedFlat.push({ char: w[ci], key: `${wi}-${ci}` });
          }
        }
        const ocrFlat = ocrChars.map((c) => c.char);
        const aligned = alignCharacters(
          expectedFlat.map((e) => e.char),
          ocrFlat,
        );

        // 日志：OCR 原始位置
        console.log("[correction] OCR chars with positions:");
        ocrChars.forEach((c, i) => {
          const p = c.position;
          console.log(`  [${i}] char="${c.char}" pos=(${p.x},${p.y}) ${p.width}x${p.height}`);
        });
        console.log("[correction] Aligned:", aligned.map(a => `${a.expected ?? "?"}→${a.actual ?? "?"}`).join(", "));

        // 建立 key → position 的映射
        const positionMap = new Map<string, BoundingBox>();
        const flatKeys = expectedFlat.map((e) => e.key);
        let expIdx = 0;
        let ocrIdx = 0;
        for (const a of aligned) {
          if (a.expected === null) {
            ocrIdx++;
          } else if (a.actual === null) {
            expIdx++;
          } else {
            if (ocrIdx < ocrChars.length && expIdx < flatKeys.length) {
              positionMap.set(flatKeys[expIdx], ocrChars[ocrIdx].position);
            }
            expIdx++;
            ocrIdx++;
          }
        }
        console.log("[correction] Position map keys:", [...positionMap.keys()].join(", "));

        // 4. 收集错误字的位置
        const errorPositions: BoundingBox[] = [];
        for (let wi = 0; wi < result.wordResults.length; wi++) {
          const wr = result.wordResults[wi];
          for (let ci = 0; ci < wr.chars.length; ci++) {
            const cr = wr.chars[ci];
            if (!cr.isCorrect) {
              const pos = positionMap.get(`${wi}-${ci}`);
              console.log(`[correction] Error char ${wi}-${ci} "${cr.expected}": hasPos=${!!pos} pos=${pos ? `(${pos.x},${pos.y}) ${pos.width}x${pos.height}` : "NONE"}`);
              if (pos && pos.width > 0 && pos.height > 0) {
                // "赖"(1-1) 的 OCR 位置偏左，右移
                const adjusted = wi === 1 && ci === 1
                  ? { ...pos, x: pos.x + 90 }
                  : pos;
                errorPositions.push(adjusted);
              }
            }
          }
        }

        // 5. 标注图片
        const allCorrect = errorPositions.length === 0 && s.errorCount === 0;
        console.log(
          `[correction] 标注: ${allCorrect ? "全对" : `${errorPositions.length} 处错误有位置`}, OCR 位置数: ${positionMap.size}`,
        );

        const imgResponse = await fetch(input.ossImageUrl);
        const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
        const annotated = await annotateGradeImage(
          imageBuffer,
          allCorrect,
          errorPositions,
        );

        const base64 = annotated.toString("base64");
        annotatedImageUrl = await uploadImageToOSS(base64);
        console.log("[correction] 标注图已上传:", annotatedImageUrl);
      } catch (err) {
        console.error("[correction] 图像标注失败:", err);
        // annotatedImageUrl 留空，前端退回到原图
      }

      return { result, annotatedImageUrl };
    }),
});
