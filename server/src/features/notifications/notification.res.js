export class NotificationResDTO {
  constructor(notification) {
    const doc = notification.toObject ? notification.toObject() : notification;

    this.id = doc._id ? doc._id.toString() : doc.id;
    this._id = this.id;
    this.recipient = doc.recipient ? doc.recipient.toString() : '';
    this.sender = doc.sender ? doc.sender.toString() : null;
    this.title = doc.title || '';
    this.message = doc.message || '';
    this.type = doc.type || 'SYSTEM';
    this.priority = doc.priority || 'MEDIUM';
    this.isRead = doc.isRead ?? false;
    this.readAt = doc.readAt || null;
    this.actionUrl = doc.actionUrl || '';
    this.metadata = doc.metadata || {};
    this.createdAt = doc.createdAt || null;
    this.updatedAt = doc.updatedAt || null;
  }
}