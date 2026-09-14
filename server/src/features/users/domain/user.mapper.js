export class UserMapper {
  static toResDTO(userDoc) {
    if (!userDoc) return null;
    const doc = userDoc.toObject ? userDoc.toObject() : userDoc;

    return {
      id: doc._id ? doc._id.toString() : doc.id,
      _id: doc._id ? doc._id.toString() : doc.id,
      name: doc.name || '',
      email: doc.email || '',
      role: doc.role || 'SUPER_ADMIN',
      phones: Array.isArray(doc.phones) && doc.phones.length > 0 
        ? doc.phones 
        : (doc.phone ? [{ number: doc.phone, type: 'Mobile', isPrimary: true }] : []),
      phone: doc.phone || (doc.phones?.[0]?.number || ''),
      profession: doc.profession || '',
      education: doc.education || '',
      country: doc.country || '',
      countryCode: doc.countryCode || 'CA',
      state: doc.state || '',
      stateCode: doc.stateCode || 'ON',
      city: doc.city || '',
      drive: doc.drive || doc.driveFolderPath || '',
      driveFolderPath: doc.driveFolderPath || doc.drive || '',
      causeContribution: doc.causeContribution || '',
      profilePictureUrl: doc.profilePictureUrl || '',
      socialMedia: Array.isArray(doc.socialMedia) ? doc.socialMedia : []
    };
  }

  static toResDTOList(userDocs) {
    if (!Array.isArray(userDocs)) return [];
    return userDocs.map((doc) => UserMapper.toResDTO(doc));
  }
}