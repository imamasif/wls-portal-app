import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const universityApi = {
  getPortalSummary: async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${API_URL}/universities/university-summary`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    return response.data.data;
  },
};
