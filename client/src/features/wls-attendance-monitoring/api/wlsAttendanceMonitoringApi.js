import axios from "axios";

const API_BASE = "http://localhost:5000/api/wls-attendance";

export const wlsAttendanceApi = {
  getSessionStatus: async (sessionId) => {
    const response = await axios.get(`${API_BASE}/session/${sessionId}`);
    return response.data;
  },

  toggleAttendance: async (payload) => {
    const response = await axios.post(`${API_BASE}/toggle`, payload);
    return response.data;
  },

  markAttendance: async (payload) => {
    const response = await axios.post(`${API_BASE}/mark`, payload);
    return response.data;
  },

  getAttendanceReport: async (sessionId) => {
    const response = await axios.get(`${API_BASE}/report/${sessionId}`);
    return response.data;
  },
};
