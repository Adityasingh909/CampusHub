const express = require("express");
const router = express.Router();
const {
  authenticate,
  authorizeTeacher,
  authorizeStudent,
} = require("../middleware/auth.middleware");
const {
  getTeacherQuizzes,
  createQuiz,
  getQuizzesByCourse,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  addQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  publishQuiz,
  getQuizAttempts,
  getAllAvailableQuizzes,
  getAvailableQuizzes,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizResult,
  getMyQuizAttempts,
} = require("../controllers/quiz.controller");

// ==========================================
// STUDENT ROUTES (Declared before generic /:quizId)
// ==========================================
router.get("/available", authenticate, authorizeStudent, getAllAvailableQuizzes);
router.get("/my-attempts", authenticate, authorizeStudent, getMyQuizAttempts);
router.get("/course/:courseId/available", authenticate, authorizeStudent, getAvailableQuizzes);
router.post("/:quizId/start", authenticate, authorizeStudent, startQuizAttempt);
router.post("/attempts/:attemptId/submit", authenticate, authorizeStudent, submitQuizAttempt);
router.get("/attempts/:attemptId/result", authenticate, getQuizResult);

// ==========================================
// TEACHER ROUTES
// ==========================================
router.get("/", authenticate, authorizeTeacher, getTeacherQuizzes);
router.post("/", authenticate, authorizeTeacher, createQuiz);
router.get("/course/:courseId", authenticate, authorizeTeacher, getQuizzesByCourse);
router.get("/:quizId", authenticate, authorizeTeacher, getQuizById);
router.put("/:quizId", authenticate, authorizeTeacher, updateQuiz);
router.delete("/:quizId", authenticate, authorizeTeacher, deleteQuiz);
router.patch("/:quizId/publish", authenticate, authorizeTeacher, publishQuiz);
router.get("/:quizId/attempts", authenticate, authorizeTeacher, getQuizAttempts);

// Question Management
router.post("/:quizId/questions", authenticate, authorizeTeacher, addQuizQuestion);
router.put("/:quizId/questions/:questionId", authenticate, authorizeTeacher, updateQuizQuestion);
router.delete("/:quizId/questions/:questionId", authenticate, authorizeTeacher, deleteQuizQuestion);

module.exports = router;
