import axios from "axios";

const API_BASE = "/api/building-maintenance";

export const buildingMaintenanceApi = {
  async getReportByDate(date, userRole = "SUPER_USER") {
    const res = await axios.get(`${API_BASE}/by-date/${encodeURIComponent(date)}`, {
      headers: { "x-user-role": userRole },
    });
    return res.data;
  },

  async saveDailyReport(data, userRole = "SUPER_USER") {
    const res = await axios.post(`${API_BASE}/save-daily`, data, {
      headers: { "x-user-role": userRole },
    });
    return res.data;
  },

  async getAllDates(userRole = "SUPER_USER") {
    const res = await axios.get(`${API_BASE}/dates`, {
      headers: { "x-user-role": userRole },
    });
    return res.data;
  },

  async getMasterTemplate(userRole = "SUPER_USER") {
    const res = await axios.get(`${API_BASE}/template`, {
      headers: { "x-user-role": userRole },
    });
    return res.data;
  },

  async addArea({ area, defaultTask, reportDate }, userRole = "SUPER_USER") {
    const res = await axios.post(
      `${API_BASE}/areas`,
      { area, defaultTask, reportDate },
      { headers: { "x-user-role": userRole } }
    );
    return res.data;
  },

  async renameArea({ oldArea, newArea, reportDate }, userRole = "SUPER_USER") {
    const res = await axios.put(
      `${API_BASE}/areas/${encodeURIComponent(oldArea)}`,
      { newArea, reportDate },
      { headers: { "x-user-role": userRole } }
    );
    return res.data;
  },

  async deleteArea({ area, reportDate }, userRole = "SUPER_USER") {
    const res = await axios.delete(
      `${API_BASE}/areas/${encodeURIComponent(area)}${reportDate ? `?reportDate=${encodeURIComponent(reportDate)}` : ""}`,
      { headers: { "x-user-role": userRole } }
    );
    return res.data;
  },

  async addTask(data, userRole = "SUPER_USER") {
    const res = await axios.post(`${API_BASE}/tasks`, data, {
      headers: { "x-user-role": userRole },
    });
    return res.data;
  },

  async updateTask(taskId, updates, reportDate, userRole = "SUPER_USER") {
    const res = await axios.put(
      `${API_BASE}/tasks/${taskId}`,
      { ...updates, reportDate },
      { headers: { "x-user-role": userRole } }
    );
    return res.data;
  },

  async deleteTask(taskId, reportDate, userRole = "SUPER_USER") {
    const res = await axios.delete(
      `${API_BASE}/tasks/${taskId}${reportDate ? `?reportDate=${encodeURIComponent(reportDate)}` : ""}`,
      { headers: { "x-user-role": userRole } }
    );
    return res.data;
  },

  async generatePdf(reportId, userRole = "SUPER_USER") {
    const res = await axios.post(
      `${API_BASE}/${reportId}/generate-pdf`,
      {},
      { headers: { "x-user-role": userRole } }
    );
    return res.data;
  },

  async uploadToGoogleDrive(reportId, userRole = "SUPER_USER") {
    const res = await axios.post(
      `${API_BASE}/${reportId}/upload-drive`,
      {},
      { headers: { "x-user-role": userRole } }
    );
    return res.data;
  },

  getPdfDownloadUrl(reportId) {
    return `${API_BASE}/download/${reportId}/pdf`;
  },
};
