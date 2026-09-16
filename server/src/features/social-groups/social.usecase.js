import { SocialGroupModel } from './social.model.js';

export class SocialGroupUseCase {
  static async createGroup(dto) {
    return await SocialGroupModel.create(dto);
  }

  static async getAllGroups() {
    return await SocialGroupModel.find().populate('members.userId', 'name email');
  }

  static async getGroupById(id) {
    return await SocialGroupModel.findById(id).populate('members.userId', 'name email');
  }

  static async updateGroup(id, dto) {
    return await SocialGroupModel.findByIdAndUpdate(id, dto, { new: true }).populate('members.userId', 'name email');
  }

  static async deleteGroup(id) {
    return await SocialGroupModel.findByIdAndDelete(id);
  }

  static async assignMember(groupId, dto) {
    const group = await SocialGroupModel.findById(groupId);
    if (!group) return null;

    const memberIndex = group.members.findIndex(m => m.userId.toString() === dto.userId.toString());
    if (memberIndex > -1) {
      group.members[memberIndex].role = dto.role;
    } else {
      group.members.push({ userId: dto.userId, role: dto.role });
    }

    await group.save();
    return await SocialGroupModel.findById(groupId).populate('members.userId', 'name email');
  }

  static async removeMember(groupId, userId) {
    return await SocialGroupModel.findByIdAndUpdate(
      groupId,
      { $pull: { members: { userId } } },
      { new: true }
    ).populate('members.userId', 'name email');
  }
}

export const socialGroupUseCase = SocialGroupUseCase;