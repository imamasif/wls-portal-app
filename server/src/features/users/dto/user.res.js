export class UserResDTO {
  constructor(user) {
    this.id = user._id ? user._id.toString() : user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.city = user.city;
    this.country = user.country;
    this.drive = user.drive;
    this.createdAt = user.createdAt;
  }
}