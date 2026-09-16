export const CreateSocialGroupSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    type: { 
      type: 'string', 
      enum: ['WHATSAPP', 'MICROSOFT_TEAMS', 'ONLINE_UNIVERSITY'] 
    },
    allowedRoles: { 
      type: 'array', 
      items: { type: 'string' } 
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
    }
  },
  additionalProperties: false
};

export const AssignSocialMemberSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string' },
    role: { type: 'string' }
  },
  required: ['userId', 'role'],
  additionalProperties: false
};