import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { students } from "./students";
import { dictationExercises } from "./dictation-exercises";

export const dictationResults = sqliteTable("dictation_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => dictationExercises.id, { onDelete: "cascade" }),
  submittedContent: text("submitted_content").notNull(),
  correctCount: integer("correct_count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
  accuracy: real("accuracy").notNull().default(0),
  durationSeconds: integer("duration_seconds"),
  errors: text("errors"),
  completedAt: text("completed_at")
    .notNull()
    .default("(datetime('now'))"),
});
