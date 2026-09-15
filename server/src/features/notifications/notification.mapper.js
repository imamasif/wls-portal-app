import { NotificationResDTO } from './notification.res.js';

export class NotificationMapper {
  static toResDTO(notificationDoc) {
    if (!notificationDoc) return null;
    return new NotificationResDTO(notificationDoc);
  }

  static toResDTOList(notificationDocs) {
    if (!Array.isArray(notificationDocs)) return [];
    return notificationDocs.map((doc) => NotificationMapper.toResDTO(doc));
  }
}