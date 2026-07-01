import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  className: text("class_name"),
  studentNo: text("student_no").unique(),
  createdAt: text("created_at")
    .notNull()
    .default("(datetime('now'))"),
  updatedAt: text("updated_at")
    .notNull()
    .default("(datetime('now'))"),
});
