import express from 'express';
import { notificationUseCase, NotificationMapper, NotificationModel } from './index.js';

const router = express.Router();

// Get all notifications for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await notificationUseCase.getNotificationsByUserId(userId);
    res.status(200).json(NotificationMapper.toResDTOList(notifications));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  try {
    const { recipient, title, message } = req.body;
    if (!recipient || !title || !message) {
      return res.status(400).json({ error: 'Recipient, title, and message are required.' });
    }

    const newNotification = await notificationUseCase.createNotification(req.body);
    res.status(201).json(NotificationMapper.toResDTO(newNotification));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a single notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await notificationUseCase.markAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    res.status(200).json(NotificationMapper.toResDTO(notification));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read for a user
router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    await notificationUseCase.markAllAsRead(userId);
    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await notificationUseCase.deleteNotification(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    res.status(200).json({ message: 'Notification deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;