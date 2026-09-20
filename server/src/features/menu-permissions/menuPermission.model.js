import mongoose from 'mongoose';
const MenuPermissionSchema = new mongoose.Schema({
  menuKey: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  path: { type: String, default: '' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuPermission', default: null }, // <-- Make sure this line is present!
  order: { type: Number, default: 0 },
  allowedRoles: { type: [String], default: ['SUPER_USER', 'WLS_ADMIN', 'USER'] },
  scopeRestriction: { type: String, enum: ['ALL', 'SELF_ONLY'], default: 'ALL' },
  isVisible: { type: Boolean, default: true }
}, { timestamps: true });

export const MenuPermissionModel = mongoose.model('MenuPermission', MenuPermissionSchema);