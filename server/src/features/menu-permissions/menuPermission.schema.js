export const CreateMenuPermissionSchema = {
  type: 'object',
  properties: {
    menuKey: { type: 'string', minLength: 1 },
    label: { type: 'string', minLength: 1 },
    path: { type: 'string' },
    parentId: { type: ['string', 'null'], default: null },
    order: { type: 'integer', default: 0 },
    allowedRoles: { 
      type: 'array', 
      items: { type: 'string' },
      minItems: 1 
    },
    scopeRestriction: { 
      type: 'string', 
      enum: ['ALL', 'SELF_ONLY'],
      default: 'SELF_ONLY' 
    },
    isVisible: { type: 'boolean', default: true }
  },
  required: ['menuKey', 'label', 'allowedRoles'],
  additionalProperties: false
};

export const UpdateMenuPermissionSchema = {
  type: 'object',
  properties: {
    menuKey: { type: 'string', minLength: 1 },
    label: { type: 'string', minLength: 1 },
    path: { type: 'string' },
    parentId: { type: ['string', 'null'] },
    order: { type: 'integer' },
    allowedRoles: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    scopeRestriction: { 
      type: 'string', 
      enum: ['ALL', 'SELF_ONLY'] 
    },
    isVisible: { type: 'boolean' }
  },
  additionalProperties: false
};