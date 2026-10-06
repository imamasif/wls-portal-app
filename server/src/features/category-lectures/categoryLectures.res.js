export class CategoryResDto {
  constructor(data) {
    this.id = data._id;
    this.source = data.source;
    this.compiler = data.compiler;
    this.language = data.language;
    this.category_id = data.category_id;
    this.category_name = data.category_name;
    this.total_lectures = data.total_lectures;
    this.lectures = data.lectures;
  }
}
