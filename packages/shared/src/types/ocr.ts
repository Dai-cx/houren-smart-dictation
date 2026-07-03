export interface OCRRecognizeInput {
  imageBase64: string;
}

export interface OCRRecognizeOutput {
  recognizedText: string;
  /** OSS 图片 URL，供多模态 AI 分析使用 */
  ossImageUrl: string;
}
