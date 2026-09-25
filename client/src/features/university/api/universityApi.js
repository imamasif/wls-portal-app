// client/src/features/university/api/universityApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api/universities";

export const universityApi = {
  getPortalSummary: async () => {
    const res = await axios.get(`${API_BASE}/portal-summary`);
    return res.data.data;
  },

  // Added methods for Super User Course Builder
  getCourses: async () => {
    const res = await axios.get(`${API_BASE}/courses`);
    return res.data;
  },

  addLectureToCourse: async (courseId, payload) => {
    const res = await axios.post(
      `${API_BASE}/courses/${courseId}/lectures`,
      payload,
    );
    return res.data;
  },

  deleteLecture: async (courseId, lectureId) => {
    const res = await axios.delete(
      `${API_BASE}/courses/${courseId}/lectures/${lectureId}`,
    );
    return res.data;
  },

  getStudentCourseProgress: async (studentId, courseId) => {
    const res = await axios.get(
      `${API_BASE}/course-progress/student-course/${studentId}/${courseId}`,
    );
    return res.data;
  },
  updateLectureProgress: async (payload) => {
    const res = await axios.post(
      `${API_BASE}/course-progress/lecture-progress`,
      payload,
    );
    return res.data;
  },
  getCourseAudit: async (courseId) => {
    const res = await axios.get(
      `${API_BASE}/course-progress/audit/course/${courseId}`,
    );
    return res.data;
  },
};
