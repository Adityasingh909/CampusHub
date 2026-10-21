
const express = require("express");
const { enrollInCourse ,getMyCourses} = require("../controllers/enrollment.controller");
const { authenticate, authorizeStudent } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/:courseId", authenticate,authorizeStudent, enrollInCourse);
router.get("/my-courses", authenticate,authorizeStudent, getMyCourses);

module.exports = router;
