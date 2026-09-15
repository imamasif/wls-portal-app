import { NotificationModel } from './notification.model.js';

export class NotificationUseCase {
  static async createNotification(dto) {
    return await NotificationModel.create(dto);
  }

  static async getNotificationsByUserId(userId) {
    return await NotificationModel.find({ recipient: userId }).sort({ createdAt: -1 });
  }

  static async markAsRead(id) {
    return await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  static async markAllAsRead(userId) {
    return await NotificationModel.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  static async deleteNotification(id) {
    return await NotificationModel.findByIdAndDelete(id);
  }
}

export const notificationUseCase = NotificationUseCase;