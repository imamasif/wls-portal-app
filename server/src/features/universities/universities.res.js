export class UniversityResponse {
  constructor(university) {
    this.id = university._id;
    this.name = university.name;
    this.code = university.code;
    this.foundedYear = university.foundedYear;
    this.active = university.active;
  }
}
