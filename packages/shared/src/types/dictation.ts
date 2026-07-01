/** 听写练习 */
export interface DictationExerciseDTO {
  id: number;
  title: string;
  content: string;
  description: string | null;
  gradeLevel: number | null;
  wordCount: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDictationInput {
  title: string;
  content: string;
  description?: string;
  gradeLevel?: number;
}
