// client/src/features/university/api/universityApi.js
import axios from "axios";

const API_BASE = "/api/university";

export const universityApi = {
  // 1. Portal Summary
  getPortalSummary: async () => {
    const res = await axios.get(`${API_BASE}/portal-summary`);
    return res.data?.data || res.data;
  },

  // 2. University Profile
  getUniversity: async () => {
    const res = await axios.get(`${API_BASE}`);
    return res.data?.data || res.data;
  },

  updateUniversity: async (id, payload) => {
    const res = await axios.put(`${API_BASE}/${id}`, payload);
    return res.data?.data || res.data;
  },

  // 3. Departments
  getDepartments: async (universityId) => {
    const params = universityId ? { universityId } : {};
    const res = await axios.get(`${API_BASE}/departments`, { params });
    return res.data?.data || res.data;
  },

  createDepartment: async (payload) => {
    const res = await axios.post(`${API_BASE}/departments`, payload);
    return res.data?.data || res.data;
  },

  updateDepartment: async (id, payload) => {
    const res = await axios.put(`${API_BASE}/departments/${id}`, payload);
    return res.data?.data || res.data;
  },

  deleteDepartment: async (id) => {
    const res = await axios.delete(`${API_BASE}/departments/${id}`);
    return res.data?.data || res.data;
  },

  // 4. Semesters
  getSemesters: async (departmentId) => {
    const res = await axios.get(`${API_BASE}/departments/${departmentId}/semesters`);
    return res.data?.data || res.data;
  },

  createSemester: async (payload) => {
    const res = await axios.post(`${API_BASE}/semesters`, payload);
    return res.data?.data || res.data;
  },

  updateSemester: async (id, payload) => {
    const res = await axios.put(`${API_BASE}/semesters/${id}`, payload);
    return res.data?.data || res.data;
  },

  deleteSemester: async (id) => {
    const res = await axios.delete(`${API_BASE}/semesters/${id}`);
    return res.data?.data || res.data;
  },

  // 5. Courses
  getCourses: async (filters = {}) => {
    const res = await axios.get(`${API_BASE}/courses`, { params: filters });
    return res.data?.data || res.data;
  },

  getCourse: async (id) => {
    const res = await axios.get(`${API_BASE}/courses/${id}`);
    return res.data?.data || res.data;
  },

  createCourse: async (payload) => {
    const res = await axios.post(`${API_BASE}/courses`, payload);
    return res.data?.data || res.data;
  },

  updateCourse: async (id, payload) => {
    const res = await axios.put(`${API_BASE}/courses/${id}`, payload);
    return res.data?.data || res.data;
  },

  toggleExamAvailability: async (id, isExamAvailable) => {
    const res = await axios.patch(`${API_BASE}/courses/${id}/toggle-exam`, {
      isExamAvailable,
    });
    return res.data?.data || res.data;
  },

  deleteCourse: async (id) => {
    const res = await axios.delete(`${API_BASE}/courses/${id}`);
    return res.data?.data || res.data;
  },

  // 6. Lectures
  getLectures: async (courseId) => {
    const res = await axios.get(`${API_BASE}/courses/${courseId}/lectures`);
    return res.data?.data || res.data;
  },

  createLecture: async (courseId, payload) => {
    const res = await axios.post(`${API_BASE}/courses/${courseId}/lectures`, payload);
    return res.data?.data || res.data;
  },

  updateLecture: async (id, payload) => {
    const res = await axios.put(`${API_BASE}/lectures/${id}`, payload);
    return res.data?.data || res.data;
  },

  deleteLecture: async (id) => {
    const res = await axios.delete(`${API_BASE}/lectures/${id}`);
    return res.data?.data || res.data;
  },

  // 7. Student Enrollments & Roll Numbers
  getEnrollments: async (filters = {}) => {
    const res = await axios.get(`${API_BASE}/enrollments`, { params: filters });
    return res.data?.data || res.data;
  },

  enrollStudent: async (payload) => {
    const res = await axios.post(`${API_BASE}/enrollments`, payload);
    return res.data?.data || res.data;
  },

  promoteStudent: async (payload) => {
    const res = await axios.post(`${API_BASE}/enrollments/promote`, payload);
    return res.data?.data || res.data;
  },

  // 8. Student Lecture Progress & Anti-Cheat
  getStudentCourseProgress: async (studentId, courseId) => {
    const res = await axios.get(
      `${API_BASE}/progress/student/${studentId}/course/${courseId}`
    );
    return res.data?.data || res.data;
  },

  updateLectureProgress: async (payload) => {
    const res = await axios.post(`${API_BASE}/progress/watch`, payload);
    return res.data?.data || res.data;
  },

  // 9. Exams
  submitExamAttempt: async (payload) => {
    const res = await axios.post(`${API_BASE}/exams/submit`, payload);
    return res.data?.data || res.data;
  },

  // 10. Certificates
  getCertificates: async (filters = {}) => {
    const res = await axios.get(`${API_BASE}/certificates`, { params: filters });
    return res.data?.data || res.data;
  },

  awardCertificate: async (payload) => {
    const res = await axios.post(`${API_BASE}/certificates/award`, payload);
    return res.data?.data || res.data;
  },

  // 11. 1-on-1 Direct Messaging (Student <-> Instructor)
  getMessages: async (courseId, studentId) => {
    const res = await axios.get(`${API_BASE}/messages/${courseId}/student/${studentId}`);
    return res.data?.data || res.data;
  },

  sendMessage: async (payload) => {
    const res = await axios.post(`${API_BASE}/messages`, payload);
    return res.data?.data || res.data;
  },

  // 12. Reorder Lectures (Drag & Drop)
  reorderLectures: async (courseId, orderedLectureIds) => {
    const res = await axios.patch(`${API_BASE}/courses/${courseId}/reorder-lectures`, {
      orderedLectureIds,
    });
    return res.data?.data || res.data;
  },

  // 13. Super User / Instructor Course Audit
  getCourseAudit: async (courseId) => {
    const res = await axios.get(`${API_BASE}/courses/${courseId}/audit`);
    return res.data?.data || res.data;
  },

  // 14. Lecture Time-stamped Notes
  saveLectureNote: async ({ studentId, courseId, lectureId, text, timestampSeconds }) => {
    const res = await axios.post(`${API_BASE}/progress/note`, {
      studentId,
      courseId,
      lectureId,
      text,
      timestampSeconds,
    });
    return res.data?.data || res.data;
  },

  getLectureNotes: async (studentId, lectureId) => {
    const res = await axios.get(`${API_BASE}/progress/notes/${studentId}/${lectureId}`);
    return res.data?.data || res.data;
  },
};
