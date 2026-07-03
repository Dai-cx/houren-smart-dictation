import type { AlignedChar, ErrorType } from "@smart-dictation/shared";

/**
 * 使用编辑距离（Levenshtein）回溯对齐两个字符序列。
 *
 * 返回 AlignedChar[]，逐一标注 substitution / deletion / insertion，
 * 解决简单逐位比对在漏字/多字时全局错位的问题。
 *
 * 回溯策略：match 优先于 substitution，substitution 优先于 insertion/deletion，
 * 使替换操作更倾向于被归类为 substitution 而非一对 insert+delete。
 */
export function alignCharacters(
  expected: string[],
  actual: string[],
): AlignedChar[] {
  const m = expected.length;
  const n = actual.length;

  // dp[i][j] = 将 expected[0..i-1] 转为 actual[0..j-1] 的最小编辑距离
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i; // 全部删除
  for (let j = 0; j <= n; j++) dp[0][j] = j; // 全部插入

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (expected[i - 1] === actual[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // match, cost 0
      } else {
        const substitution = dp[i - 1][j - 1] + 1;
        const deletion = dp[i - 1][j] + 1;
        const insertion = dp[i][j - 1] + 1;
        dp[i][j] = Math.min(substitution, deletion, insertion);
      }
    }
  }

  // ---- 回溯：从 (m, n) 走到 (0, 0) ----
  const result: AlignedChar[] = [];
  let i = m;
  let j = n;

  // 回溯方向转换表
  const toErrorType = (
    op: "match" | "sub" | "del" | "ins",
    isCorrect: boolean,
  ): ErrorType => {
    if (isCorrect) return "substitution"; // match 时不使用此值，但保证类型安全
    switch (op) {
      case "sub":
        return "substitution";
      case "del":
        return "deletion";
      case "ins":
        return "insertion";
      default:
        return "substitution";
    }
  };

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expected[i - 1] === actual[j - 1]) {
      // match
      result.unshift({
        expected: expected[i - 1],
        actual: actual[j - 1],
        errorType: "substitution", // isCorrect=true 时不使用此字段
        isCorrect: true,
      });
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      // substitution
      result.unshift({
        expected: expected[i - 1],
        actual: actual[j - 1],
        errorType: "substitution",
        isCorrect: false,
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      // deletion（漏字）
      result.unshift({
        expected: expected[i - 1],
        actual: null,
        errorType: "deletion",
        isCorrect: false,
      });
      i--;
    } else {
      // insertion（多字）
      result.unshift({
        expected: null,
        actual: actual[j - 1],
        errorType: "insertion",
        isCorrect: false,
      });
      j--;
    }
  }

  return result;
}

/**
 * 从 AlignedChar[] 提取统计信息
 */
export function computeStats(aligned: AlignedChar[]) {
  const totalCount = aligned.filter((c) => c.expected !== null).length;
  const correctCount = aligned.filter((c) => c.isCorrect).length;
  const accuracy =
    totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return { correctCount, totalCount, accuracy };
}
