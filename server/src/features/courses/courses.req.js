export class CreateCourseRequest {
  constructor(body) {
    this.title = body.title;
    this.semesterId = body.semesterId;
    this.active = body.active ?? true;
  }
}
