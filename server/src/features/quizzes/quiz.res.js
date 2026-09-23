export class QuizResDto {
  constructor(doc) {
    this.id = doc._id || doc.id;
    this.title = doc.title;
    this.isActive = doc.isActive;
    this.isPublished = doc.isPublished;
    this.description = doc.description || "";
    this.questions = doc.questions || [];
    this.createdBy = doc.createdBy;
    this.createdAt = doc.createdAt;
    this.updatedAt = doc.updatedAt;
  }
}
