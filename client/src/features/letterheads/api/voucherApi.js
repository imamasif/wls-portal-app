import axios from 'axios';

const API_BASE = '/api/letterheads';

export const voucherApi = {
  async getVouchers(userRole = 'SUPER_USER') {
    const res = await axios.get(`${API_BASE}/vouchers`, {
      headers: { 'x-user-role': userRole },
    });
    return res.data;
  },

  async createVoucher(data, userRole = 'SUPER_USER') {
    const res = await axios.post(`${API_BASE}/vouchers`, data, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole,
      },
    });
    return res.data;
  },

  async getVoucherById(id, userRole = 'SUPER_USER') {
    const res = await axios.get(`${API_BASE}/vouchers/${id}`, {
      headers: { 'x-user-role': userRole },
    });
    return res.data;
  },

  async updateVoucher(id, data, userRole = 'SUPER_USER') {
    const res = await axios.put(`${API_BASE}/vouchers/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole,
      },
    });
    return res.data;
  },

  async deleteVoucher(id, userRole = 'SUPER_USER') {
    const res = await axios.delete(`${API_BASE}/vouchers/${id}`, {
      headers: { 'x-user-role': userRole },
    });
    return res.data;
  },

  async uploadReceipt(file, userRole = 'SUPER_USER') {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE}/vouchers/upload-receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-user-role': userRole,
      },
    });
    return res.data;
  },

  async uploadToGoogleDrive(id, folderIdOrUrl, userRole = 'SUPER_USER') {
    const res = await axios.post(
      `${API_BASE}/vouchers/${id}/drive`,
      { folderIdOrUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
      }
    );
    return res.data;
  },

  getPdfDownloadUrl(id) {
    return `${API_BASE}/vouchers/${id}/download/pdf`;
  },

  getPdfPreviewUrl(id) {
    return `${API_BASE}/vouchers/${id}/preview/pdf`;
  },

  getDocxDownloadUrl(id) {
    return `${API_BASE}/vouchers/${id}/download/docx`;
  },
};

export default voucherApi;
