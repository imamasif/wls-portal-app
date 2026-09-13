export class UserResDTO {
  constructor(user) {
    const doc = user.toObject ? user.toObject() : user;

    this.id = doc._id ? doc._id.toString() : doc.id;
    this._id = this.id;
    this.name = doc.name || '';
    this.email = doc.email || '';
    this.role = doc.role || 'USER';
    this.profession = doc.profession || '';
    this.education = doc.education || '';
    this.country = doc.country || '';
    this.countryCode = doc.countryCode || '';
    this.state = doc.state || '';
    this.stateCode = doc.stateCode || '';
    this.city = doc.city || '';
    this.drive = doc.drive || doc.driveFolderPath || '';
    this.driveFolderPath = doc.driveFolderPath || doc.drive || '';
    this.causeContribution = doc.causeContribution || '';
    this.profilePictureUrl = doc.profilePictureUrl || '';
    this.socialMedia = Array.isArray(doc.socialMedia) ? doc.socialMedia : [];
  }
}