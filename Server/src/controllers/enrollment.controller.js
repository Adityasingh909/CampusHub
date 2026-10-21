const prisma = require("../config/prisma");

exports.enrollInCourse = async (req, res) => {
  const courseId = Number(req.params.courseId);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid course ID",
    });
  }
  const existingCourse = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!existingCourse) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }
  try {
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: req.user.userId,
        courseId: courseId,
      },
    });
    return res.status(200).json({
      success: true,
      message: "enrollement created",
      studentId: req.user.userId,
      courseId,
      enrollment,
    });
  } catch (err) {
    console.error(err);

    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Already enrolled in this course",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getMyCourses = async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: req.user.userId,
    },
    include: {
      course: true,
    },
  });
  try {
    return res.status(200).json({
      success: true,
      enrollments,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      message: "Internal server error",
    });
  }
};
