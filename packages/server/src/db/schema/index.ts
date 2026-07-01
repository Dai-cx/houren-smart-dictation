export * from "./students";
export * from "./dictation-exercises";
export * from "./dictation-results";

import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { students } from "./students";
import type { dictationExercises } from "./dictation-exercises";
import type { dictationResults } from "./dictation-results";

export type Student = InferSelectModel<typeof students>;
export type NewStudent = InferInsertModel<typeof students>;
export type DictationExercise = InferSelectModel<typeof dictationExercises>;
export type NewDictationExercise = InferInsertModel<typeof dictationExercises>;
export type DictationResult = InferSelectModel<typeof dictationResults>;
export type NewDictationResult = InferInsertModel<typeof dictationResults>;
