import axios from 'axios';

const BASE_URL = '/api/social-groups';

export const socialGroupApi = {
  // Get all groups by type ('whatsapp' | 'teams' | 'university')
  getGroupsByType: async (groupType) => {
    const response = await axios.get(`${BASE_URL}`, { params: { type: groupType } });
    return response.data;
  },

  // Create a new social group
  // payload: { name, type, description, batchYear, batchSemester, link }
  createGroup: async (payload) => {
    const response = await axios.post(`${BASE_URL}`, payload);
    return response.data;
  },

  // Delete a group
  deleteGroup: async (groupId) => {
    const response = await axios.delete(`${BASE_URL}/${groupId}`);
    return response.data;
  },

  // Assign a user to a group
  assignUserToGroup: async (groupId, userId) => {
    const response = await axios.post(`${BASE_URL}/${groupId}/members`, { userId });
    return response.data;
  },

  // Remove a user from a group
  removeUserFromGroup: async (groupId, userId) => {
    const response = await axios.delete(`${BASE_URL}/${groupId}/members/${userId}`);
    return response.data;
  },

  // Get social groups assigned to a specific user (for UserProfileDetail)
  getUserSocialGroups: async (userId) => {
    const response = await axios.get(`${BASE_URL}/user/${userId}`);
    return response.data;
  }
};