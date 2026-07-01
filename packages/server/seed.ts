import { db } from "./src/db";
import { students, dictationExercises } from "./src/db/schema";

async function seed() {
  console.log("Seeding database...");

  // Insert sample students
  const studentData = [
    { name: "小明", className: "三年级2班", studentNo: "2024001" },
    { name: "小红", className: "三年级2班", studentNo: "2024002" },
    { name: "小刚", className: "三年级2班", studentNo: "2024003" },
  ];

  const insertedStudents = db.insert(students).values(studentData).returning().all();
  console.log(`Inserted ${insertedStudents.length} students`);

  // Insert sample dictation exercises
  const exerciseData = [
    {
      title: "第一课：春天来了",
      content: "春天来了，小草从地下探出头来，那是春天的眉毛吧？",
      description: "听写第一课生字词，注意标点符号",
      gradeLevel: 3,
      wordCount: 0,
    },
    {
      title: "第二课：找春天",
      content: "我们几个孩子脱掉棉袄，冲出家门，奔向田野，去寻找春天。",
      description: "注意'脱掉'、'冲出'、'奔向'几个动词的写法",
      gradeLevel: 3,
      wordCount: 0,
    },
  ];

  for (const ex of exerciseData) {
    ex.wordCount = ex.content.replace(/\s/g, "").length;
  }

  const insertedExercises = db
    .insert(dictationExercises)
    .values(exerciseData)
    .returning()
    .all();
  console.log(`Inserted ${insertedExercises.length} dictation exercises`);

  console.log("Seeding complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
