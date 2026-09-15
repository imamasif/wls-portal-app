export const CreateNotificationSchema = {
  type: 'object',
  properties: {
    recipient: { type: 'string' },
    title: { type: 'string', minLength: 2 },
    message: { type: 'string', minLength: 2 },
    type: { type: 'string', enum: ['SYSTEM', 'ALERT', 'MESSAGE', 'REMINDER', 'TASK', 'UPDATE'] },
    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
    actionUrl: { type: 'string' }
  },
  required: ['recipient', 'title', 'message'],
  additionalProperties: true
};