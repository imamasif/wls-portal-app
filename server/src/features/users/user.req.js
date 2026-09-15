export class CreateUserReqDTO {
  constructor({ name, email, password, role, city, country, profilePictureUrl, socialMedia, phones, phone, profession, education, countryCode, state, stateCode, drive, driveFolderPath, causeContribution }) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role || 'USER';
    this.phones = phones || [];
    this.phone = phone || '';
    this.profession = profession || '';
    this.education = education || '';
    this.country = country || '';
    this.countryCode = countryCode || '';
    this.state = state || '';
    this.stateCode = stateCode || '';
    this.city = city || '';
    this.drive = drive || '';
    this.driveFolderPath = driveFolderPath || '';
    this.causeContribution = causeContribution || '';
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
    if (payload.phones) this.phones = payload.phones;
    if (payload.phone) this.phone = payload.phone;
    if (payload.profession) this.profession = payload.profession;
    if (payload.education) this.education = payload.education;
    if (payload.country) this.country = payload.country;
    if (payload.countryCode) this.countryCode = payload.countryCode;
    if (payload.state) this.state = payload.state;
    if (payload.stateCode) this.stateCode = payload.stateCode;
    if (payload.city) this.city = payload.city;
    if (payload.drive) this.drive = payload.drive;
    if (payload.driveFolderPath) this.driveFolderPath = payload.driveFolderPath;
    if (payload.causeContribution) this.causeContribution = payload.causeContribution;
    if (payload.profilePictureUrl) this.profilePictureUrl = payload.profilePictureUrl;
    if (payload.socialMedia) this.socialMedia = payload.socialMedia;
  }
}