const express = require("express");
const { getStudentDashboard } = require("../controllers/dashboard.controller");
const {
  authenticate,
  authorizeStudent,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/student", authenticate, authorizeStudent, getStudentDashboard);

module.exports = router;