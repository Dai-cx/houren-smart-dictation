import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const dictationExercises = sqliteTable("dictation_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  description: text("description"),
  gradeLevel: integer("grade_level"),
  wordCount: integer("word_count"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at")
    .notNull()
    .default("(datetime('now'))"),
  updatedAt: text("updated_at")
    .notNull()
    .default("(datetime('now'))"),
});
