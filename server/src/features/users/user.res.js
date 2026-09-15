export class UserResDTO {
  constructor(user) {
    const doc = user.toObject ? user.toObject() : user;

    this.id = doc._id ? doc._id.toString() : doc.id;
    this._id = this.id;
    this.name = doc.name || '';
    this.email = doc.email || '';
    this.role = doc.role || 'USER';
    this.phones = Array.isArray(doc.phones) && doc.phones.length > 0 
      ? doc.phones 
      : (doc.phone ? [{ number: doc.phone, type: 'Mobile', isPrimary: true }] : []);
    this.phone = doc.phone || (doc.phones?.[0]?.number || '');
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
    this.isActive = doc.isActive !== undefined ? doc.isActive : true;
    this.underRadar = doc.underRadar || false;
    this.radarReason = doc.radarReason || '';
    this.auditTrail = Array.isArray(doc.auditTrail) ? doc.auditTrail : [];
  }
}