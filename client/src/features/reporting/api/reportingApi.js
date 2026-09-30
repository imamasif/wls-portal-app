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
};
