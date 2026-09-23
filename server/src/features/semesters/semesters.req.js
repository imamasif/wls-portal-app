export class CreateSemesterRequest {
  constructor(body) {
    this.semesterNumber = body.semesterNumber;
    this.title = body.title;
    this.courses = body.courses || [];
  }
}
