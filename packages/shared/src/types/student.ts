/** 学生信息 */
export interface StudentDTO {
  id: number;
  name: string;
  className: string | null;
  studentNo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentInput {
  name: string;
  className?: string;
  studentNo?: string;
}
