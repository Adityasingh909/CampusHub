const prisma = require("../config/prisma");

// ==========================================
// TEACHER CONTROLLERS
// ==========================================

/**
 * Get all quizzes for courses taught by the authenticated teacher.
 */
exports.getTeacherQuizzes = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const quizzes = await prisma.quiz.findMany({
      where: {
        course: {
          teacherId,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes,
    });
  } catch (error) {
    console.error("Get teacher quizzes error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quizzes.",
    });
  }
};

/**
 * Get quizzes for a specific course (Teacher view).
 */
exports.getQuizzesByCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        teacherId: req.user.userId,
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or you are not its instructor.",
      });
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes,
    });
  } catch (error) {
    console.error("Get quizzes by course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quizzes.",
    });
  }
};

/**
 * Get a single quiz by ID with its questions (Teacher view).
 */
exports.getQuizById = async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);

    if (!Number.isInteger(quizId) || quizId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        course: {
          teacherId: req.user.userId,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        questions: {
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or you do not have permission to view it.",
      });
    }

    return res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error("Get quiz by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz.",
    });
  }
};

/**
 * Create a new quiz.
 */
exports.createQuiz = async (req, res) => {
  try {
    const { courseId, title, description, durationMinutes, totalMarks, windowStart, windowEnd } = req.body;

    if (!courseId || !title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Course ID and quiz title are required.",
      });
    }

    const parsedCourse = Number(courseId);
    if (!Number.isInteger(parsedCourse) || parsedCourse <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    const course = await prisma.course.findFirst({
      where: {
        id: parsedCourse,
        teacherId: req.user.userId,
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or you are not its instructor.",
      });
    }

    const quiz = await prisma.quiz.create({
      data: {
        courseId: parsedCourse,
        title: title.trim(),
        description: description ? description.trim() : "",
        durationMinutes: Number(durationMinutes) > 0 ? Number(durationMinutes) : 30,
        totalMarks: Number(totalMarks) > 0 ? Number(totalMarks) : 100,
        status: "DRAFT",
        windowStart: windowStart ? new Date(windowStart) : null,
        windowEnd: windowEnd ? new Date(windowEnd) : null,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Quiz created successfully.",
      quiz,
    });
  } catch (error) {
    console.error("Create quiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create quiz.",
    });
  }
};

/**
 * Update quiz metadata.
 */
exports.updateQuiz = async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);
    const { title, description, durationMinutes, totalMarks, windowStart, windowEnd, status } = req.body;

    if (!Number.isInteger(quizId) || quizId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        course: {
          teacherId: req.user.userId,
        },
      },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!existingQuiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or you are not its instructor.",
      });
    }

    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty.",
        });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = typeof description === "string" ? description.trim() : "";
    }

    if (durationMinutes !== undefined) {
      const parsedDuration = Number(durationMinutes);
      if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
        return res.status(400).json({
          success: false,
          message: "Duration must be a positive integer in minutes.",
        });
      }
      updateData.durationMinutes = parsedDuration;
    }

    if (totalMarks !== undefined) {
      const parsedTotal = Number(totalMarks);
      if (!Number.isInteger(parsedTotal) || parsedTotal <= 0) {
        return res.status(400).json({
          success: false,
          message: "Total marks must be a positive integer.",
        });
      }
      if (existingQuiz._count.attempts > 0 && parsedTotal !== existingQuiz.totalMarks) {
        return res.status(400).json({
          success: false,
          message: "Cannot modify total marks after students have attempted this quiz.",
        });
      }
      updateData.totalMarks = parsedTotal;
    }

    if (windowStart !== undefined) {
      updateData.windowStart = windowStart ? new Date(windowStart) : null;
    }

    if (windowEnd !== undefined) {
      updateData.windowEnd = windowEnd ? new Date(windowEnd) : null;
    }

    if (status !== undefined && ["DRAFT", "PUBLISHED"].includes(status)) {
      updateData.status = status;
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Quiz updated successfully.",
      quiz: updatedQuiz,
    });
  } catch (error) {
    console.error("Update quiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update quiz.",
    });
  }
};

/**
 * Delete a quiz.
 */
exports.deleteQuiz = async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);

    if (!Number.isInteger(quizId) || quizId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        course: {
          teacherId: req.user.userId,
        },
      },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or you are not its instructor.",
      });
    }

    if (quiz._count.attempts > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete this quiz because students have already submitted attempts.",
      });
    }

    await prisma.quiz.delete({
      where: { id: quizId },
    });

    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully.",
    });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete quiz.",
    });
  }
};

/**
 * Add a question to a quiz.
 */
exports.addQuizQuestion = async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);
    const { question, options, correctAnswer, explanation, points } = req.body;

    if (!Number.isInteger(quizId) || quizId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question text is required.",
      });
    }

    if (
      !Array.isArray(options) ||
      options.length < 2 ||
      options.some((opt) => typeof opt !== "string" || !opt.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "At least two non-empty options are required.",
      });
    }

    const cleanedOptions = options.map((opt) => opt.trim());

    if (typeof correctAnswer !== "string" || !cleanedOptions.includes(correctAnswer.trim())) {
      return res.status(400).json({
        success: false,
        message: "Correct answer must match one of the options.",
      });
    }

    const parsedPoints = points === undefined ? 1 : Number(points);
    if (!Number.isInteger(parsedPoints) || parsedPoints <= 0) {
      return res.status(400).json({
        success: false,
        message: "Points must be a positive integer.",
      });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        course: {
          teacherId: req.user.userId,
        },
      },
      include: {
        _count: {
          select: { attempts: true, questions: true },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or you are not its instructor.",
      });
    }

    if (quiz._count.attempts > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot add questions after students have attempted this quiz.",
      });
    }

    const newQuestion = await prisma.quizQuestion.create({
      data: {
        quizId,
        question: question.trim(),
        options: cleanedOptions,
        correctAnswer: correctAnswer.trim(),
        explanation: typeof explanation === "string" && explanation.trim() ? explanation.trim() : null,
        points: parsedPoints,
        order: quiz._count.questions,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Question added successfully.",
      question: newQuestion,
    });
  } catch (error) {
    console.error("Add quiz question error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add question.",
    });
  }
};

/**
 * Update an existing quiz question.
 */
exports.updateQuizQuestion = async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);
    const questionId = Number(req.params.questionId);
    const { question, options, correctAnswer, explanation, points } = req.body;

    if (!Number.isInteger(quizId) || quizId <= 0 || !Number.isInteger(questionId) || questionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID or question ID.",
      });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        course: {
          teacherId: req.user.userId,
        },
      },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or you are not its instructor.",
      });
    }

    if (quiz._count.attempts > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit questions after students have attempted this quiz.",
      });
    }

    const existingQuestion = await prisma.quizQuestion.findFirst({
      where: {
        id: questionId,
        quizId,
      },
    });

    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found in this quiz.",
      });
    }

    const updateData = {};

    if (question !== undefined) {
      if (typeof question !== "string" || !question.trim()) {
        return res.status(400).json({
          success: false,
          message: "Question text must not be empty.",
        });
      }
      updateData.question = question.trim();
    }

    let finalOptions = existingQuestion.options;
    if (options !== undefined) {
      if (
        !Array.isArray(options) ||
        options.length < 2 ||
        options.some((opt) => typeof opt !== "string" || !opt.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "At least two non-empty options are required.",
        });
      }
      finalOptions = options.map((opt) => opt.trim());
      updateData.options = finalOptions;
    }

    let finalCorrectAnswer = existingQuestion.correctAnswer;
    if (correctAnswer !== undefined) {
      if (typeof correctAnswer !== "string" || !correctAnswer.trim()) {
        return res.status(400).json({
          success: false,
          message: "Correct answer must be specified.",
        });
      }
      finalCorrectAnswer = correctAnswer.trim();
      updateData.correctAnswer = finalCorrectAnswer;
    }

    if (!finalOptions.includes(finalCorrectAnswer)) {
      return res.status(400).json({
        success: false,
        message: "Correct answer must match one of the options.",
      });
    }

    if (points !== undefined) {
      const parsedPoints = Number(points);
      if (!Number.isInteger(parsedPoints) || parsedPoints <= 0) {
        return res.status(400).json({
          success: false,
          message: "Points must be a positive integer.",
        });
      }
      updateData.points = parsedPoints;
    }

    if (explanation !== undefined) {
      updateData.explanation =
        typeof explanation === "string" && explanation.trim() ? explanation.trim() : null;
    }

    const updatedQuestion = await prisma.quizQuestion.update({
      where: { id: questionId },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Question updated successfully.",
      question: updatedQuestion,
    });
  } catch (error) {
    console.error("Update quiz question error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update question.",
    });
  }
};

/**
 * Delete a quiz question.
 */
exports.deleteQuizQuestion = async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);
    const questionId = Number(req.params.questionId);

    if (!Number.isInteger(quizId) || quizId <= 0 || !Number.isInteger(questionId) || questionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID or question ID.",
      });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        course: {
          teacherId: req.user.userId,
        },
      },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or you are not its instructor.",
      });
    }

    if (quiz._count.attempts > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete questions after students have attempted this quiz.",
      });
    }

    const question = await prisma.quizQuestion.findFirst({
      where: {
        id: questionId,
        quizId,
      },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found in this quiz.",
      });
    }

    await prisma.quizQuestion.delete({
      where: { id: questionId },
    });

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (error) {
    console.error("Delete quiz question error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete question.",
    });
  }
};

/**
 * Publish a quiz.
 */
exports.publishQuiz = async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);

    if (!Number.isInteger(quizId) || quizId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        course: {
          teacherId: req.user.userId,
        },
      },
      include: {
        questions: {
          select: {
            id: true,
            points: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or you are not its instructor.",
      });
    }

    if (quiz.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "You must add at least one question before publishing the quiz.",
      });
    }

    const calculatedTotal = quiz.questions.reduce((sum, q) => sum + q.points, 0);

    if (calculatedTotal !== quiz.totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Question points total (${calculatedTotal}) does not match quiz total marks (${quiz.totalMarks}). Please adjust points or total marks before publishing.`,
      });
    }

    const publishedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        status: "PUBLISHED",
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Quiz published successfully.",
      quiz: publishedQuiz,
    });
  } catch (error) {
    console.error("Publish quiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish quiz.",
    });
  }
};

/**
 * Get student attempts for a quiz (Teacher view).
 */
exports.getQuizAttempts = async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);

    if (!Number.isInteger(quizId) || quizId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        course: {
          teacherId: req.user.userId,
        },
      },
      select: {
        id: true,
        title: true,
        totalMarks: true,
        durationMinutes: true,
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or you are not its instructor.",
      });
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
      },
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
        startedAt: "desc",
      },
    });

    const completedAttempts = attempts.filter((a) => a.status === "SUBMITTED");
    const avgScore =
      completedAttempts.length > 0
        ? Math.round(
            (completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length) * 10
          ) / 10
        : 0;

    const highestScore = completedAttempts.reduce(
      (max, a) => Math.max(max, a.score || 0),
      0
    );

    return res.status(200).json({
      success: true,
      quiz,
      stats: {
        totalAttempts: attempts.length,
        completedAttempts: completedAttempts.length,
        averageScore: avgScore,
        highestScore,
      },
      attempts: attempts.map((a) => ({
        id: a.id,
        studentId: a.studentId,
        studentName: a.student.name || "Student",
        studentEmail: a.student.email,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        status: a.status,
        score: a.score,
        percentage: a.percentage,
        totalMarks: quiz.totalMarks,
      })),
    });
  } catch (error) {
    console.error("Get quiz attempts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz attempts.",
    });
  }
};

// ==========================================
// STUDENT CONTROLLERS
// ==========================================

/**
 * Get all available published quizzes across enrolled courses for the authenticated student.
 */
exports.getAllAvailableQuizzes = async (req, res) => {
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
        quizzes: [],
      });
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        status: "PUBLISHED",
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
        attempts: {
          where: { studentId },
          orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            status: true,
            score: true,
            percentage: true,
            submittedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes: quizzes.map((q) => {
        const submittedAttempt = q.attempts.find((a) => a.status === "SUBMITTED");
        const inProgressAttempt = q.attempts.find((a) => a.status === "IN_PROGRESS");
        const latestAttempt = submittedAttempt || inProgressAttempt || q.attempts[0] || null;
        const hasAttempted = Boolean(submittedAttempt);

        return {
          id: q.id,
          courseId: q.courseId,
          courseTitle: q.course.title,
          courseCode: q.course.code,
          title: q.title,
          description: q.description,
          durationMinutes: q.durationMinutes,
          totalMarks: q.totalMarks,
          questionCount: q._count.questions,
          windowStart: q.windowStart,
          windowEnd: q.windowEnd,
          createdAt: q.createdAt,
          hasAttempted,
          attemptId: latestAttempt?.id || null,
          attemptStatus: hasAttempted ? "SUBMITTED" : (latestAttempt?.status || null),
          latestScore: hasAttempted ? submittedAttempt.score : (latestAttempt?.score ?? null),
          latestPercentage: hasAttempted ? submittedAttempt.percentage : (latestAttempt?.percentage ?? null),
        };
      }),
    });
  } catch (error) {
    console.error("Get all available quizzes error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available quizzes.",
    });
  }
};

/**
 * Get available published quizzes for a specific course (Student view with enrollment check).
 */
exports.getAvailableQuizzes = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const studentId = req.user.userId;

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    // Verify course enrollment server-side
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
      },
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course.",
      });
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        courseId,
        status: "PUBLISHED",
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
        attempts: {
          where: { studentId },
          orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            status: true,
            score: true,
            percentage: true,
            submittedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes: quizzes.map((q) => {
        const submittedAttempt = q.attempts.find((a) => a.status === "SUBMITTED");
        const inProgressAttempt = q.attempts.find((a) => a.status === "IN_PROGRESS");
        const latestAttempt = submittedAttempt || inProgressAttempt || q.attempts[0] || null;
        const hasAttempted = Boolean(submittedAttempt);

        return {
          id: q.id,
          courseId: q.courseId,
          courseTitle: q.course.title,
          courseCode: q.course.code,
          title: q.title,
          description: q.description,
          durationMinutes: q.durationMinutes,
          totalMarks: q.totalMarks,
          questionCount: q._count.questions,
          windowStart: q.windowStart,
          windowEnd: q.windowEnd,
          createdAt: q.createdAt,
          hasAttempted,
          attemptId: latestAttempt?.id || null,
          attemptStatus: hasAttempted ? "SUBMITTED" : (latestAttempt?.status || null),
          latestScore: hasAttempted ? submittedAttempt.score : (latestAttempt?.score ?? null),
          latestPercentage: hasAttempted ? submittedAttempt.percentage : (latestAttempt?.percentage ?? null),
        };
      }),
    });
  } catch (error) {
    console.error("Get available quizzes error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available quizzes.",
    });
  }
};

/**
 * Start or resume a quiz attempt.
 * Strips correctAnswer and explanation from question objects.
 */
exports.startQuizAttempt = async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);
    const studentId = req.user.userId;

    if (!Number.isInteger(quizId) || quizId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID.",
      });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        status: "PUBLISHED",
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        questions: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            question: true,
            options: true,
            points: true,
            order: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Published quiz not found.",
      });
    }

    if (quiz.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "This quiz currently has no questions.",
      });
    }

    // Enforce course enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId: quiz.courseId,
      },
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You cannot attempt this quiz because you are not enrolled in the course.",
      });
    }

    // Availability window check
    const now = new Date();
    if (quiz.windowStart && now < new Date(quiz.windowStart)) {
      return res.status(403).json({
        success: false,
        message: "This quiz is not available yet.",
      });
    }
    if (quiz.windowEnd && now > new Date(quiz.windowEnd)) {
      return res.status(403).json({
        success: false,
        message: "This quiz deadline window has passed.",
      });
    }

    // Check if student already submitted this quiz
    const submittedAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId,
        status: "SUBMITTED",
      },
      orderBy: { id: "desc" },
    });

    if (submittedAttempt) {
      // Clean up any lingering duplicate in-progress attempts
      await prisma.quizAttempt.deleteMany({
        where: {
          quizId,
          studentId,
          status: "IN_PROGRESS",
        },
      });

      return res.status(409).json({
        success: false,
        message: "You have already completed and submitted this quiz.",
        attemptId: submittedAttempt.id,
      });
    }

    // Active attempt recovery / refresh check
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId,
        status: "IN_PROGRESS",
      },
      orderBy: { id: "desc" },
    });

    if (existingAttempt) {
      const deadline = new Date(
        existingAttempt.startedAt.getTime() + quiz.durationMinutes * 60 * 1000
      );

      if (now < deadline) {
        // Return existing in-progress attempt without creating a duplicate
        return res.status(200).json({
          success: true,
          resumed: true,
          message: "Resumed active quiz attempt.",
          attempt: {
            id: existingAttempt.id,
            quizId: existingAttempt.quizId,
            startedAt: existingAttempt.startedAt,
            status: existingAttempt.status,
            durationMinutes: quiz.durationMinutes,
          },
          quiz: {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            durationMinutes: quiz.durationMinutes,
            totalMarks: quiz.totalMarks,
            course: quiz.course,
            questions: quiz.questions,
          },
        });
      } else {
        // Active attempt expired
        await prisma.quizAttempt.update({
          where: { id: existingAttempt.id },
          data: {
            status: "SUBMITTED",
            submittedAt: deadline,
            score: 0,
            percentage: 0,
          },
        });

        return res.status(403).json({
          success: false,
          message: "Your previous quiz attempt time limit has expired.",
        });
      }
    }

    // Create a new attempt
    const newAttempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId,
        status: "IN_PROGRESS",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Quiz started successfully.",
      attempt: {
        id: newAttempt.id,
        quizId: newAttempt.quizId,
        startedAt: newAttempt.startedAt,
        status: newAttempt.status,
        durationMinutes: quiz.durationMinutes,
      },
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        durationMinutes: quiz.durationMinutes,
        totalMarks: quiz.totalMarks,
        course: quiz.course,
        questions: quiz.questions,
      },
    });
  } catch (error) {
    console.error("Start quiz attempt error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start quiz.",
    });
  }
};

/**
 * Submit answers for an in-progress quiz attempt.
 * Evaluates score and percentage atomically server-side.
 */
exports.submitQuizAttempt = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    const studentId = req.user.userId;
    const { answers } = req.body;

    if (!Number.isInteger(attemptId) || attemptId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Answers must be an array.",
      });
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        studentId,
        status: "IN_PROGRESS",
      },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Active quiz attempt not found or already submitted.",
      });
    }

    // Deadline check with 30-second network latency buffer
    const durationMs = attempt.quiz.durationMinutes * 60 * 1000;
    const deadline = new Date(attempt.startedAt.getTime() + durationMs + 30000);

    if (new Date() > deadline) {
      // Mark as submitted with 0 or existing
      await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          score: 0,
          percentage: 0,
        },
      });

      return res.status(403).json({
        success: false,
        message: "The quiz time limit has expired.",
      });
    }

    // Map submitted answers
    const submittedAnswerMap = new Map();
    for (const a of answers) {
      if (a && a.questionId) {
        submittedAnswerMap.set(Number(a.questionId), a.selectedOption);
      }
    }

    let totalScore = 0;
    const answerRecords = [];

    for (const question of attempt.quiz.questions) {
      const selectedOption = submittedAnswerMap.has(question.id)
        ? submittedAnswerMap.get(question.id)
        : null;

      const isCorrect =
        typeof selectedOption === "string" && selectedOption === question.correctAnswer;
      const pointsAwarded = isCorrect ? question.points : 0;
      totalScore += pointsAwarded;

      answerRecords.push({
        attemptId,
        questionId: question.id,
        selectedOption: typeof selectedOption === "string" ? selectedOption : null,
        isCorrect,
        pointsAwarded,
      });
    }

    const totalMarks = attempt.quiz.totalMarks;
    const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 1000) / 10 : 0;

    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.quizAttempt.updateMany({
        where: {
          id: attemptId,
          studentId,
          status: "IN_PROGRESS",
        },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          score: totalScore,
          percentage,
        },
      });

      if (claimed.count !== 1) {
        throw new Error("ATTEMPT_ALREADY_SUBMITTED");
      }

      // Purge any orphan/duplicate IN_PROGRESS attempts for this quiz & student
      await tx.quizAttempt.deleteMany({
        where: {
          quizId: attempt.quizId,
          studentId,
          status: "IN_PROGRESS",
          id: { not: attemptId },
        },
      });

      if (answerRecords.length > 0) {
        await tx.quizAnswer.createMany({
          data: answerRecords,
        });
      }

      return tx.quizAttempt.findUnique({
        where: { id: attemptId },
        select: {
          id: true,
          quizId: true,
          submittedAt: true,
          status: true,
          score: true,
          percentage: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Quiz submitted successfully.",
      result,
      totalMarks,
    });
  } catch (error) {
    console.error("Submit quiz attempt error:", error);
    if (error.message === "ATTEMPT_ALREADY_SUBMITTED") {
      return res.status(409).json({
        success: false,
        message: "This quiz attempt has already been submitted.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to submit quiz.",
    });
  }
};

/**
 * Get detailed result and question review for a submitted quiz attempt.
 */
exports.getQuizResult = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    const userId = req.user.userId;
    const role = req.user.role;

    if (!Number.isInteger(attemptId) || attemptId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        status: "SUBMITTED",
        OR: [
          { studentId: userId },
          ...(role === "TEACHER"
            ? [{ quiz: { course: { teacherId: userId } } }]
            : []),
        ],
      },
      include: {
        quiz: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                code: true,
              },
            },
            questions: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Submitted quiz result not found or access denied.",
      });
    }

    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

    const reviewQuestions = attempt.quiz.questions.map((q) => {
      const studentAnswer = answerMap.get(q.id);
      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        pointsPossible: q.points,
        selectedOption: studentAnswer?.selectedOption ?? null,
        correctAnswer: q.correctAnswer,
        isCorrect: studentAnswer?.isCorrect ?? false,
        pointsAwarded: studentAnswer?.pointsAwarded ?? 0,
        explanation: q.explanation,
      };
    });

    return res.status(200).json({
      success: true,
      result: {
        attemptId: attempt.id,
        quizId: attempt.quizId,
        quizTitle: attempt.quiz.title,
        quizDescription: attempt.quiz.description,
        courseId: attempt.quiz.course.id,
        courseTitle: attempt.quiz.course.title,
        courseCode: attempt.quiz.course.code,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        score: attempt.score,
        totalMarks: attempt.quiz.totalMarks,
        percentage: attempt.percentage,
        student: {
          id: attempt.student.id,
          name: attempt.student.name,
          email: attempt.student.email,
        },
        questions: reviewQuestions,
      },
    });
  } catch (error) {
    console.error("Get quiz result error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz result.",
    });
  }
};

/**
 * Get paginated history of quiz attempts for the authenticated student.
 */
exports.getMyQuizAttempts = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer and limit must be between 1 and 50.",
      });
    }

    const skip = (page - 1) * limit;

    // Purge any orphan IN_PROGRESS attempts where the quiz has already been submitted
    await prisma.quizAttempt.deleteMany({
      where: {
        studentId,
        status: "IN_PROGRESS",
        quiz: {
          attempts: {
            some: {
              studentId,
              status: "SUBMITTED",
            },
          },
        },
      },
    });

    const [attempts, totalAttempts] = await prisma.$transaction([
      prisma.quizAttempt.findMany({
        where: {
          studentId,
        },
        include: {
          quiz: {
            select: {
              title: true,
              totalMarks: true,
              durationMinutes: true,
              course: {
                select: {
                  id: true,
                  title: true,
                  code: true,
                },
              },
            },
          },
        },
        orderBy: [{ startedAt: "desc" }, { id: "desc" }],
        skip,
        take: limit,
      }),
      prisma.quizAttempt.count({
        where: { studentId },
      }),
    ]);

    const totalPages = Math.ceil(totalAttempts / limit);

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalAttempts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      attempts: attempts.map((a) => ({
        attemptId: a.id,
        quizId: a.quizId,
        quizTitle: a.quiz.title,
        courseId: a.quiz.course.id,
        courseTitle: a.quiz.course.title,
        courseCode: a.quiz.course.code,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        status: a.status,
        score: a.score,
        totalMarks: a.quiz.totalMarks,
        percentage: a.percentage,
        durationMinutes: a.quiz.durationMinutes,
      })),
    });
  } catch (error) {
    console.error("Get my quiz attempts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz history.",
    });
  }
};
