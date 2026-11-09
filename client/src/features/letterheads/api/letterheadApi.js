import axios from 'axios';

const API_BASE = '/api/letterheads';

export const letterheadApi = {
  async generateLetterhead({ file, template, includeBismillah, includeWatermark, customDate, userRole = 'SUPER_USER' }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('template', template);
    formData.append('includeBismillah', Boolean(includeBismillah));
    formData.append('includeWatermark', Boolean(includeWatermark));
    if (customDate) formData.append('customDate', customDate);
    formData.append('userRole', userRole);

    const res = await axios.post(`${API_BASE}/generate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-user-role': userRole,
      },
    });
    return res.data;
  },

  async customizeDocument({ file, baseType, elements, options, userRole = 'SUPER_USER' }) {
    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('baseType', baseType || 'blank');
    formData.append('elements', JSON.stringify(elements || []));
    formData.append('options', JSON.stringify(options || {}));
    formData.append('userRole', userRole);

    const res = await axios.post(`${API_BASE}/customize`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-user-role': userRole,
      },
    });
    return res.data;
  },

  async mergeTwoFiles({ templateFile, contentFile, userRole = 'SUPER_USER' }) {
    const formData = new FormData();
    formData.append('templateFile', templateFile);
    formData.append('contentFile', contentFile);
    formData.append('userRole', userRole);

    const res = await axios.post(`${API_BASE}/merge-two-files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-user-role': userRole,
      },
    });
    return res.data;
  },

  getDownloadUrl(docId, type, fileName) {
    const query = fileName ? `?name=${encodeURIComponent(fileName)}` : '';
    return `${API_BASE}/download/${docId}/${type}${query}`;
  },

  getPreviewUrl(docId) {
    return `${API_BASE}/preview/${docId}`;
  },
};
