import { fetchApi } from "../../../api";

export const quizApi = {
  // Quizzes CRUD
  getAllQuizzes: async () => {
    return await fetchApi("/api/quizzes");
  },

  getQuizById: async (id) => {
    return await fetchApi(`/api/quizzes/${id}`);
  },

  createQuiz: async (data) => {
    return await fetchApi("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateQuiz: async (id, quizData) => {
    const response = await fetchApi(`/api/quizzes/${id}`, {
      method: "PUT", // or PATCH depending on your backend
      body: JSON.stringify(quizData),
    });
    return response;
  },

  deleteQuiz: async (id) => {
    return await fetchApi(`/api/quizzes/${id}`, {
      method: "DELETE",
    });
  },

  // Submissions & Reports
  submitQuiz: async (submissionData) => {
    return await fetchApi("/api/quizzes/submit", {
      method: "POST",
      body: JSON.stringify(submissionData),
    });
  },

  getSubmissionsByQuiz: async (quizId) => {
    return await fetchApi(`/api/quiz-submissions/quiz/${quizId}`);
  },

  getSubmissionsByUser: async (userId) => {
    return await fetchApi(`/api/quiz-submissions/user/${userId}`);
  },
};
