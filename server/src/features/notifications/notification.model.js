import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    enum: ['SYSTEM', 'ALERT', 'MESSAGE', 'REMINDER', 'TASK', 'UPDATE'], 
    default: 'SYSTEM' 
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
  isRead: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },
  actionUrl: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);