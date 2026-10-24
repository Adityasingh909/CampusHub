const prisma = require("../config/prisma");

// 1. POST /api/assignments (Teacher creates assignment)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, totalPoints, courseId } = req.body;

    if (!title?.trim() || !dueDate || courseId === undefined || courseId === null) {
      return res.status(400).json({
        success: false,
        message: "Title, due date, and course ID are required",
      });
    }

    const parsedCourseId = Number(courseId);
    const parsedTotalPoints = totalPoints === undefined ? 100 : Number(totalPoints);
    const parsedDueDate = new Date(dueDate);

    if (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Course ID must be a positive integer",
      });
    }

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date",
      });
    }

    if (!Number.isInteger(parsedTotalPoints) || parsedTotalPoints <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total points must be a positive integer",
      });
    }

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: parsedCourseId,
        teacherId: req.user.userId,
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or you do not own this course",
      });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        dueDate: parsedDueDate,
        totalPoints: parsedTotalPoints,
        courseId: parsedCourseId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment,
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create assignment",
    });
  }
};

// 2. GET /api/assignments/student (Student fetches all enrolled assignments)
exports.getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      select: { courseId: true },
    });

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    if (enrolledCourseIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        assignments: [],
      });
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            instructor: true,
            credits: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        submissions: {
          where: { studentId },
          select: {
            id: true,
            status: true,
            score: true,
            feedback: true,
            submittedAt: true,
            content: true,
            fileUrl: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const formatted = assignments.map((assignment) => {
      const mySubmission = assignment.submissions[0] || null;
      const { submissions, ...rest } = assignment;
      return {
        ...rest,
        mySubmission,
        submissionStatus: mySubmission ? mySubmission.status : "PENDING",
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      assignments: formatted,
    });
  } catch (error) {
    console.error("Get student assignments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student assignments",
    });
  }
};

// 3. GET /api/assignments/:assignmentId (Single assignment details)
exports.getAssignmentById = async (req, res) => {
  try {
    const assignmentId = Number(req.params.assignmentId);

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            instructor: true,
            teacherId: true,
            credits: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Role-appropriate access check
    if (req.user.role === "TEACHER") {
      if (assignment.course.teacherId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "You do not teach this course",
        });
      }

      return res.status(200).json({
        success: true,
        assignment,
      });
    }

    if (req.user.role === "STUDENT") {
      // Check enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.userId,
            courseId: assignment.courseId,
          },
        },
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in the course for this assignment",
        });
      }

      // Fetch the student's submission if one exists
      const mySubmission = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId: req.user.userId,
          },
        },
        select: {
          id: true,
          status: true,
          score: true,
          feedback: true,
          content: true,
          fileUrl: true,
          submittedAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        success: true,
        assignment: {
          ...assignment,
          mySubmission,
          submissionStatus: mySubmission ? mySubmission.status : "PENDING",
        },
      });
    }

    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  } catch (error) {
    console.error("Get assignment by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignment details",
    });
  }
};

// 4. GET /api/assignments/course/:courseId (Assignments for a specific course)
exports.getAssignmentsByCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          where: { studentId: req.user.userId },
          select: { id: true },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (req.user.role === "TEACHER") {
      if (course.teacherId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "You do not teach this course",
        });
      }
    } else if (req.user.role === "STUDENT") {
      if (course.enrollments.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You are not enrolled in this course",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: {
        submissions: req.user.role === "STUDENT" ? {
          where: { studentId: req.user.userId },
          select: {
            id: true,
            status: true,
            score: true,
            feedback: true,
            submittedAt: true,
          },
        } : false,
      },
      orderBy: { dueDate: "asc" },
    });

    const formatted = assignments.map((a) => {
      const mySubmission = a.submissions?.[0] || null;
      return {
        ...a,
        mySubmission,
        submissionStatus: mySubmission ? mySubmission.status : "PENDING",
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      assignments: formatted,
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignments",
    });
  }
};

// 5. POST /api/assignments/:assignmentId/submit (Submit solution)
exports.submitAssignment = async (req, res) => {
  try {
    const assignmentId = Number(req.params.assignmentId);
    const { content, fileUrl } = req.body;
    const studentId = req.user.userId;

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    if (!content?.trim() && !fileUrl?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide written content or an attached file URL",
      });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        dueDate: true,
        courseId: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: assignment.courseId,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // Check existing submission to prevent overwriting if already graded
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
    });

    if (existingSubmission && existingSubmission.status === "GRADED") {
      return res.status(400).json({
        success: false,
        message: "This assignment has already been graded and cannot be resubmitted.",
      });
    }

    // Upsert submission
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      update: {
        content: content?.trim() || "",
        fileUrl: fileUrl?.trim() || null,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      create: {
        assignmentId,
        studentId,
        content: content?.trim() || "",
        fileUrl: fileUrl?.trim() || null,
        status: "SUBMITTED",
      },
    });

    return res.status(200).json({
      success: true,
      message: existingSubmission ? "Assignment submission updated successfully" : "Assignment submitted successfully",
      submission,
    });
  } catch (error) {
    console.error("Submit assignment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit assignment",
    });
  }
};

// 6. GET /api/assignments/my-submissions (Student's submitted assignments)
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId: req.user.userId,
      },
      include: {
        assignment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                code: true,
                instructor: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
      getAssignment: submissions, // backwards compatibility
    });
  } catch (error) {
    console.error("Get my submissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch submissions",
    });
  }
};

exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const assignmentId = Number(req.params.assignmentId);

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.course.teacherId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You do not teach this course",
      });
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Submissions fetched successfully",
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Get assignment submissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignment submissions",
    });
  }
};

// 8. PATCH /api/assignments/submissions/:submissionId/grade (Teacher grades submission)
exports.gradeSubmission = async (req, res) => {
  try {
    const submissionId = Number(req.params.submissionId);
    const { score, feedback } = req.body;

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID",
      });
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    if (submission.assignment.course.teacherId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You do not have grading access for this course",
      });
    }

    const maxPoints = submission.assignment.totalPoints;
    const numericScore = Number(score);

    if (isNaN(numericScore) || numericScore < 0) {
      return res.status(400).json({
        success: false,
        message: "Score must be a non-negative number",
      });
    }

    if (numericScore > maxPoints) {
      return res.status(400).json({
        success: false,
        message: `Score cannot exceed maximum total points of ${maxPoints}`,
      });
    }

    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: Math.round(numericScore),
        feedback: feedback?.trim() || "",
        status: "GRADED",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Submission graded successfully",
      submission: updatedSubmission,
    });
  } catch (err) {
    console.error("Grade submission error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to grade submission",
    });
  }
};
