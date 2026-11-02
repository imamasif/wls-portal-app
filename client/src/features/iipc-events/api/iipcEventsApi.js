import axios from "axios";

const API_BASE = "/api/iipc-events";

export const iipcEventsApi = {
  // Fetch all projects/events
  getAllEvents: async (status = "ALL") => {
    const res = await axios.get(API_BASE, { params: { status } });
    return res.data;
  },

  // Fetch single project/event
  getEventById: async (id) => {
    const res = await axios.get(`${API_BASE}/${id}`);
    return res.data;
  },

  // Create new project/event
  createEvent: async (payload) => {
    const res = await axios.post(API_BASE, payload);
    return res.data;
  },

  // Update existing project/event
  updateEvent: async (id, payload) => {
    const res = await axios.put(`${API_BASE}/${id}`, payload);
    return res.data;
  },

  // Delete project/event
  deleteEvent: async (id) => {
    const res = await axios.delete(`${API_BASE}/${id}`);
    return res.data;
  },

  // Get donations for a specific event (sorted, sequence numbered)
  getEventDonations: async (eventId) => {
    const res = await axios.get(`${API_BASE}/${eventId}/donations`);
    return res.data;
  },

  // Create pledge / donation (Super user on behalf or user self)
  createDonation: async (payload) => {
    const res = await axios.post(`${API_BASE}/donations`, payload);
    return res.data;
  },

  // Update pledge / donation
  updateDonation: async (donationId, payload) => {
    const res = await axios.put(`${API_BASE}/donations/${donationId}`, payload);
    return res.data;
  },

  // Super user mark payment received
  markPayment: async (donationId, payload) => {
    const res = await axios.patch(
      `${API_BASE}/donations/${donationId}/pay`,
      payload
    );
    return res.data;
  },

  // Normal user / Super user submit payment proof and remarks
  submitProof: async (donationId, payload) => {
    const res = await axios.patch(
      `${API_BASE}/donations/${donationId}/proof`,
      payload
    );
    return res.data;
  },

  // Comprehensive report for event
  getEventReport: async (eventId) => {
    const res = await axios.get(`${API_BASE}/${eventId}/report`);
    return res.data;
  },

  // Get donations for a specific user
  getUserDonations: async (userId) => {
    const res = await axios.get(`${API_BASE}/user/${userId}/donations`);
    return res.data;
  },

  // Fetch all registered users for donor selection dropdown
  getAllUsers: async () => {
    const res = await axios.get("/api/users");
    return res.data;
  },
};
