// client/src/features/reporting/api/reportingApi.js
import axios from "axios";

export const reportingApi = {
  getAnalyticsReport: async (params = {}) => {
    const cleanParams = {};
    if (params.sessionId && params.sessionId !== "ALL") {
      cleanParams.sessionId = params.sessionId;
    }
    if (params.userId && params.userId !== "ALL") {
      cleanParams.userId = params.userId;
    }
    if (params.role) {
      cleanParams.role = params.role;
    }
    if (params.groupNumber && params.groupNumber !== "ALL") {
      cleanParams.groupNumber = params.groupNumber;
    }

    const res = await axios.get("/api/reports/analytics-report", {
      params: cleanParams,
    });
    return res.data;
  },

  getQuizAnalytics: async () => {
    const res = await axios.get("/api/quiz-submissions/analytics");
    return res.data;
  },

  getSessions: async () => {
    const res = await axios.get("/api/wls-sessions");
    return res.data;
  },
};

export default reportingApi;
