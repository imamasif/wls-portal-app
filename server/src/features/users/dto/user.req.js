export class CreateUserReqDTO {
  constructor({ name, email, password, role, city, country, profilePictureUrl, socialMedia }) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role || 'STUDENT';
    this.city = city || '';
    this.country = country || '';
    this.profilePictureUrl = profilePictureUrl || '';
    this.socialMedia = socialMedia || [];
  }
}

export class UpdateUserReqDTO {
  constructor(payload) {
    if (payload.name) this.name = payload.name;
    if (payload.email) this.email = payload.email;
    if (payload.password) this.password = payload.password;
    if (payload.role) this.role = payload.role;
    if (payload.city) this.city = payload.city;
    if (payload.country) this.country = payload.country;
    if (payload.profilePictureUrl) this.profilePictureUrl = payload.profilePictureUrl;
    if (payload.socialMedia) this.socialMedia = payload.socialMedia;
  }
}