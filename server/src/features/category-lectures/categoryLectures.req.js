export class CategoryReqDto {
  constructor(body) {
    this.source = body.source;
    this.compiler = body.compiler;
    this.language = body.language || "eng";
    this.category_id = body.category_id;
    this.category_name = body.category_name;
    this.total_lectures =
      body.total_lectures || (body.lectures ? body.lectures.length : 0);
    this.lectures = body.lectures || [];
  }
}
