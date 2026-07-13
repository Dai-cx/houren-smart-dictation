/** 错误分类（细粒度，由 AI 视觉模型判断） */
export type ErrorType =
  | "correct"         // 正确
  | "missing_stroke"  // 漏笔画
  | "extra_stroke"    // 多笔画
  | "wrong_stroke"    // 笔画错误
  | "wrong_radical"   // 偏旁错误
  | "wrong_char"      // 写成其他字
  | "missing_char"    // 漏写
  | "extra_char"      // 多写
  | "uncertain";      // 无法识别

/** 单字批改结果（由 qwen-vl-plus 直接看图判断，无 OCR 位置信息） */
export interface CharResult {
  /** 期望的正确字符 */
  expected: string;
  /** AI 从图片中看到的实际字符，null = 未识别/漏写 */
  written: string | null;
  /** 是否书写正确 */
  isCorrect: boolean;
  /** AI 判断置信度 0-1 */
  confidence: number;
  /** 批注说明 */
  note: string;
  /** 错误分类 */
  errorType: ErrorType;
}

/** 逐词批改结果 */
export interface WordResult {
  /** 原词 */
  word: string;
  /** 词内逐字结果 */
  chars: CharResult[];
  /** 整个词是否被判定为正确（所有字都正确）*/
  isCorrect: boolean;
}

/** 统计摘要（后端强制计算，不信任 AI 返回值） */
export interface CorrectionSummary {
  /** 总词数 */
  totalWords: number;
  /** 正确词数 */
  correctWords: number;
  /** 总字数 */
  totalChars: number;
  /** 正确字数 */
  correctChars: number;
  /** 错误字数 */
  errorCount: number;
  /** 正确率 0-100，保留 1 位小数 */
  accuracyRate: number;
}

/** 完整批改结果 */
export interface CorrectionResult {
  /** 逐词结果 */
  wordResults: WordResult[];
  /** 统计摘要 */
  summary: CorrectionSummary;
  /** 统计数据是否异常（正确率超范围、负数等） */
  anomalous: boolean;
}

/** 单字错因详情 */
export interface ErrorDetail {
  /** 所在词索引（从 0 开始） */
  wordIndex: number;
  /** 词内字索引（从 0 开始） */
  charIndex: number;
  /** 期望字符 */
  expected: string;
  /** 实际书写字符 */
  written: string | null;
  /** 错误分类 */
  errorType: ErrorType;
  /** 错因分析文字 */
  analysis: string;
  /** 纠正建议 */
  suggestion: string;
}

/** correction.analyze 输入 */
export interface CorrectionAnalyzeInput {
  /** 手写图片的 OSS URL */
  ossImageUrl: string;
  /** 期望词表 */
  words: string[];
}

/** correction.analyze 输出 */
export interface CorrectionAnalysis {
  /** 视觉批改结果 */
  result: CorrectionResult;
  /** 错因详情（仅在有错字时包含） */
  errorDetails?: ErrorDetail[];
}
