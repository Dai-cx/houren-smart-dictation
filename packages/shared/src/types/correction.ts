/** 对齐后的错误类型 */
export type ErrorType = "substitution" | "deletion" | "insertion";

/** 单个字符对齐结果（编辑距离回溯产物） */
export interface AlignedChar {
  /** 期望字符，null 表示多字（无期望） */
  expected: string | null;
  /** 实际识别字符，null 表示漏字（未识别） */
  actual: string | null;
  /** 错误类型 */
  errorType: ErrorType;
  /** 是否正确 */
  isCorrect: boolean;
}

/** 单个错字分析 */
export interface ErrorAnalysis {
  /** 在期望字符串中的位置 */
  charIndex: number;
  /** 期望的正确字符 */
  expectedChar: string;
  /** 实际识别字符 */
  actualChar: string;
  /** 错误分类标签，如"偏旁遗漏""形近混淆" */
  errorType: string;
  /** 错因说明 */
  reason: string;
  /** 纠正建议 */
  suggestion: string;
}

/** 完整 AI 错因分析结果 */
export interface CorrectionAnalysis {
  /** 整体总结 */
  overallSummary: string;
  /** 逐字分析列表 */
  errorAnalyses: ErrorAnalysis[];
}

/** correction.analyze 输入 */
export interface CorrectionAnalyzeInput {
  words: string[];
  recognizedText: string;
  errors: { expected: string; actual: string }[];
  /** 手写图片的 OSS URL，供多模态模型直接查看字迹 */
  ossImageUrl: string;
}
