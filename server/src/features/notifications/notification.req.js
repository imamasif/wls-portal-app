export class CreateNotificationReqDTO {
  constructor({ recipient, sender, title, message, type, priority, actionUrl, metadata }) {
    this.recipient = recipient;
    this.sender = sender || null;
    this.title = title;
    this.message = message;
    this.type = type || 'SYSTEM';
    this.priority = priority || 'MEDIUM';
    this.actionUrl = actionUrl || '';
    this.metadata = metadata || {};
  }
}