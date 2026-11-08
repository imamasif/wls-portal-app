const ALLOWED_USER_ROLES = [
  'SUPER_USER',
  'WLS_ADMIN',
  'USER',
  'university_super_user',
  'university_admin',
  'university_student',
  'UNIVERSITY_SUPER_USER',
  'UNIVERSITY_ADMIN',
  'UNIVERSITY_STUDENT'
];

export const CreateUserSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    role: { type: 'string', enum: ALLOWED_USER_ROLES },
    roles: { type: 'array', items: { type: 'string' } },
    gender: { type: 'string', enum: ['Male', 'Female', ''] },
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
  additionalProperties: true
};

export const UpdateUserSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    role: { type: 'string', enum: ALLOWED_USER_ROLES },
    roles: { type: 'array', items: { type: 'string' } },
    gender: { type: 'string', enum: ['Male', 'Female', ''] },
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
  additionalProperties: true
};
