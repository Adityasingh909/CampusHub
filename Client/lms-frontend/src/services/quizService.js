import { api } from "./api";

/**
 * Quiz Service for Teacher and Student operations.
 * Interacts with backend `/api/quizzes` endpoints.
 */

// ==========================================
// TEACHER ENDPOINTS
// ==========================================

/**
 * Get all quizzes for the authenticated teacher across their courses.
 */
export async function getTeacherQuizzes(options = {}) {
  return api().get("/quizzes", options);
}

/**
 * Get quizzes for a specific course (Teacher view).
 */
export async function getQuizzesByCourse(courseId, options = {}) {
  return api().get(`/quizzes/course/${courseId}`, options);
}

/**
 * Get a single quiz by ID with its questions (Teacher view).
 */
export async function getQuizById(quizId, options = {}) {
  return api().get(`/quizzes/${quizId}`, options);
}

/**
 * Create a new quiz.
 * @param {{ courseId: number, title: string, description?: string, durationMinutes?: number, totalMarks?: number }} data
 */
export async function createQuiz(data, options = {}) {
  return api().post("/quizzes", data, options);
}

/**
 * Update quiz metadata.
 * @param {number|string} quizId
 * @param {{ title?: string, description?: string, durationMinutes?: number, totalMarks?: number, status?: string }} data
 */
export async function updateQuiz(quizId, data, options = {}) {
  return api().put(`/quizzes/${quizId}`, data, options);
}

/**
 * Delete a quiz.
 */
export async function deleteQuiz(quizId, options = {}) {
  return api().delete(`/quizzes/${quizId}`, options);
}

/**
 * Add a multiple choice question to a quiz.
 * @param {number|string} quizId
 * @param {{ question: string, options: string[], correctAnswer: string, points?: number, explanation?: string }} data
 */
export async function addQuizQuestion(quizId, data, options = {}) {
  return api().post(`/quizzes/${quizId}/questions`, data, options);
}

/**
 * Update a question in a quiz.
 * @param {number|string} quizId
 * @param {number|string} questionId
 * @param {{ question?: string, options?: string[], correctAnswer?: string, points?: number, explanation?: string }} data
 */
export async function updateQuizQuestion(quizId, questionId, data, options = {}) {
  return api().put(`/quizzes/${quizId}/questions/${questionId}`, data, options);
}

/**
 * Delete a question from a quiz.
 */
export async function deleteQuizQuestion(quizId, questionId, options = {}) {
  return api().delete(`/quizzes/${quizId}/questions/${questionId}`, options);
}

/**
 * Publish a quiz.
 */
export async function publishQuiz(quizId, options = {}) {
  return api().patch(`/quizzes/${quizId}/publish`, {}, options);
}

/**
 * Get student attempts and statistics for a quiz (Teacher view).
 */
export async function getQuizAttempts(quizId, options = {}) {
  return api().get(`/quizzes/${quizId}/attempts`, options);
}

// ==========================================
// STUDENT ENDPOINTS
// ==========================================

/**
 * Get all available published quizzes for the authenticated student across enrolled courses.
 */
export async function getAllAvailableQuizzes(options = {}) {
  return api().get("/quizzes/available", options);
}

/**
 * Get available published quizzes for a specific course (Student view).
 */
export async function getAvailableQuizzes(courseId, options = {}) {
  return api().get(`/quizzes/course/${courseId}/available`, options);
}

/**
 * Start or resume a quiz attempt.
 * Returns question details without correct answers or explanations.
 */
export async function startQuizAttempt(quizId, options = {}) {
  return api().post(`/quizzes/${quizId}/start`, {}, options);
}

/**
 * Submit answers for an in-progress quiz attempt.
 * @param {number|string} attemptId
 * @param {Array<{ questionId: number, selectedOption: string|null }>} answers
 */
export async function submitQuizAttempt(attemptId, answers, options = {}) {
  return api().post(`/quizzes/attempts/${attemptId}/submit`, { answers }, options);
}

/**
 * Get detailed result and question review for a submitted quiz attempt.
 */
export async function getQuizResult(attemptId, options = {}) {
  return api().get(`/quizzes/attempts/${attemptId}/result`, options);
}

/**
 * Get paginated history of quiz attempts for the authenticated student.
 */
export async function getMyQuizAttempts(page = 1, limit = 10, options = {}) {
  return api().get(`/quizzes/my-attempts?page=${page}&limit=${limit}`, options);
}
