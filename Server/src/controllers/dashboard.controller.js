const prisma = require("../config/prisma");

exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            credits: true,
          },
        },
      },
    });
    
    const student = await prisma.user.findUnique({
  where: { id: req.user.userId },
  select: {
    name: true,
    email: true,
  },
});

    const totalEnrolled = enrollments.length;

    const inProgress = enrollments.filter(
      (enrollment) => enrollment.status === "IN_PROGRESS"
    ).length;

    const completed = enrollments.filter(
      (enrollment) => enrollment.status === "COMPLETED"
    ).length;

    const totalCredits = enrollments.reduce(
      (sum, enrollment) => sum + enrollment.course.credits,
      0
    );

    return res.status(200).json({
      success: true,
      student,
      stats: {
        totalEnrolled,
        inProgress,
        completed,
        totalCredits,
      },
      courses: enrollments,
    });
  } catch (error) {
    console.error("Student dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load student dashboard",
    });
  }
};