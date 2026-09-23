export class CreateUniversityRequest {
  constructor(body) {
    this.name = body.name || "WLS Global Islamic & Technical University";
    this.code = body.code;
    this.foundedYear = body.foundedYear || 2026;
    this.active = body.active ?? true;
  }
}
