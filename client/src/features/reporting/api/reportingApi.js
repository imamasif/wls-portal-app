// client/src/features/reporting/api/reportingApi.js
import axios from "axios";

export const reportingApi = {
  getAnalyticsReport: async () => {
    const res = await axios.get("/api/reports/analytics-report");
    return res.data;
  },

  getQuizAnalytics: async () => {
    const res = await axios.get("/api/quiz-submissions/analytics");
    return res.data;
  },

  getSessions: async () => {
    const res = await axios.get("/api/wls-sessions"); // Adjust route to match your WLS session router
    return res.data;
  },
};
