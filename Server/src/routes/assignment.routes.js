const express = require("express");
const {
  createAssignment,
  getStudentAssignments,
  getAssignmentById,
  getAssignmentsByCourse,
  submitAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  gradeSubmission,
} = require("../controllers/assignment.controller");
const {
  authenticate,
  authorizeTeacher,
  authorizeStudent,
} = require("../middleware/auth.middleware");

const router = express.Router();

// 1. Static and specific routes first
router.post("/", authenticate, authorizeTeacher, createAssignment);
router.get("/student", authenticate, authorizeStudent, getStudentAssignments);
router.get("/my-submissions", authenticate, authorizeStudent, getMySubmissions);
router.get("/course/:courseId", authenticate, getAssignmentsByCourse);
router.patch("/submissions/:submissionId/grade", authenticate, authorizeTeacher, gradeSubmission);

// 2. Generic parameter routes
router.get("/:assignmentId", authenticate, getAssignmentById);
router.post("/:assignmentId/submit", authenticate, authorizeStudent, submitAssignment);
router.get("/:assignmentId/submissions", authenticate, authorizeTeacher, getAssignmentSubmissions);

module.exports = router;
