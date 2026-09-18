export const CreateSocialGroupSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    type: { 
      type: 'string', 
      enum: ['WHATSAPP', 'MICROSOFT_TEAMS', 'ONLINE_UNIVERSITY'] 
    },
    isActive: { type: 'boolean' },
    allowedRoles: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    members: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          role: { type: 'string' }
        },
        required: ['userId', 'role'],
        additionalProperties: false
      }
    }
  },
  required: ['name', 'type'],
  additionalProperties: false
};

export const UpdateSocialGroupSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    type: { 
      type: 'string', 
      enum: ['WHATSAPP', 'MICROSOFT_TEAMS', 'ONLINE_UNIVERSITY'] 
    },
    isActive: { type: 'boolean' },
    allowedRoles: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    members: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          role: { type: 'string' }
        },
        required: ['userId', 'role'],
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
};

export const AssignSocialMemberSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string', minLength: 1 },
    role: { type: 'string', minLength: 1 }
  },
  required: ['userId', 'role'],
  additionalProperties: false
};