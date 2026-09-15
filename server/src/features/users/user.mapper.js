import { UserResDTO } from './user.res.js';

export class UserMapper {
  static toResDTO(userDoc) {
    if (!userDoc) return null;
    return new UserResDTO(userDoc);
  }

  static toResDTOList(userDocs) {
    if (!Array.isArray(userDocs)) return [];
    return userDocs.map((doc) => UserMapper.toResDTO(doc));
  }
}