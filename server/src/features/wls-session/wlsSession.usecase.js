import { WlsSessionModel } from './wlsSession.model.js';
import { WlsSessionMapper } from './wlsSession.mapper.js';
import mongoose from 'mongoose';

export class WlsSessionUseCase {
  async getAllSessions() {
    const docs = await WlsSessionModel.find().lean().sort({ createdAt: -1 });

    // Collect all admin IDs across group assignments
    const adminIds = new Set();
    docs.forEach(doc => {
      if (doc.groupAssignments) {
        Object.values(doc.groupAssignments).forEach(group => {
          group.adminIds?.forEach(id => adminIds.add(id));
        });
      }
    });

    // Fetch user details for collected IDs
    const User = mongoose.model('User'); // Adjust model name if needed
    const users = await User.find({ _id: { $in: Array.from(adminIds) } }, 'fullName name email').lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u.fullName || u.name || u.email]));

    // Map admin ObjectIds to user object details
    docs.forEach(doc => {
      if (doc.groupAssignments) {
        Object.keys(doc.groupAssignments).forEach(key => {
          const group = doc.groupAssignments[key];
          if (group.adminIds) {
            group.admins = group.adminIds.map(id => ({
              id,
              name: userMap.get(id.toString()) || id
            }));
          }
        });
      }
    });

    return WlsSessionMapper.toResponseList(docs);
  }

  async createSession(dto) {
    const created = await WlsSessionModel.create(dto);
    return WlsSessionMapper.toResponse(created);
  }

  async updateStatus(id, status, cancelReason = '') {
    const updated = await WlsSessionModel.findByIdAndUpdate(
      id,
      { status, cancelReason },
      { new: true }
    );
    return WlsSessionMapper.toResponse(updated);
  }

  async deleteSession(id) {
    await WlsSessionModel.findByIdAndDelete(id);
    return { success: true };
  }
}