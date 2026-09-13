export const CreateUserSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    role: { type: 'string', enum: ['SUPER_ADMIN', 'WLS_ADMIN', 'MARKING_ADMIN', 'STUDENT'] },
    city: { type: 'string' },
    country: { type: 'string' },
    profilePictureUrl: { type: 'string' },
    socialMedia: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          platform: { type: 'string' },
          handleUrl: { type: 'string' }
        },
        required: ['platform', 'handleUrl']
      }
    }
  },
  required: ['name', 'email', 'password'],
  additionalProperties: false
};

export const UpdateUserSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    role: { type: 'string', enum: ['SUPER_ADMIN', 'WLS_ADMIN', 'MARKING_ADMIN', 'STUDENT'] },
    city: { type: 'string' },
    country: { type: 'string' },
    profilePictureUrl: { type: 'string' },
    socialMedia: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          platform: { type: 'string' },
          handleUrl: { type: 'string' }
        },
        required: ['platform', 'handleUrl']
      }
    }
  },
  additionalProperties: false
};