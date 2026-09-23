export class SemesterResponse {
  constructor(semester) {
    this.id = semester._id;
    this.semesterNumber = semester.semesterNumber;
    this.title = semester.title;
    this.courses = semester.courses;
    this.active = semester.active;
  }
}
