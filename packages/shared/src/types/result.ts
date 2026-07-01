/** 单个错误条目 */
export interface ErrorEntry {
  position: number;
  expected: string;
  got: string;
}

/** 听写结果 */
export interface DictationResultDTO {
  id: number;
  studentId: number;
  exerciseId: number;
  submittedContent: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  durationSeconds: number | null;
  errors: ErrorEntry[] | null;
  completedAt: string;
}

export interface SubmitResultInput {
  studentId: number;
  exerciseId: number;
  submittedContent: string;
  durationSeconds?: number;
}
