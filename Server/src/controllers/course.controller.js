const prisma = require("../config/prisma");

exports.getCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    return res.status(200).json({
      success: true,
      count: courses.length,
      courses: courses,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.createCourse = async (req, res) => {
  const {
    code,
    title,
    description,
    instructor,
    thumbnail,
    credits,
    category,
    schedule,
    instructorRole,
  } = req.body;

  if (!code || !title) {
    return res.status(400).json({
      success: false,
      message: "Course code and title are required",
    });
  }

  try {
    const course = await prisma.course.create({
      data: {
        teacherId: req.user.userId,
        code,
        title,
        description,
        instructor,
        thumbnail,
        credits,
        category,
        schedule,
        instructorRole,
        
      },
    });
    return res.status(201).json({
      success: true,
      message: "courses created ",
      course,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


exports.updateCourse = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Only the assigned instructor can edit this course.
    if (existingCourse.teacherId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own courses",
      });
    }

    const {
      code,
      title,
      description,
      instructor,
      thumbnail,
      credits,
      category,
      schedule,
      instructorRole,
      syllabusUrl,
      officeHours,
      learningObjectives,
    } = req.body;

    const data = {};

    // Update only fields explicitly provided by the client.
    const allowedFields = {
      code,
      title,
      description,
      instructor,
      thumbnail,
      credits,
      category,
      schedule,
      instructorRole,
      syllabusUrl,
      officeHours,
    };

    for (const [key, value] of Object.entries(allowedFields)) {
      if (value !== undefined) {
        data[key] = value;
      }
    }

    if (learningObjectives !== undefined) {
      if (
        !Array.isArray(learningObjectives) ||
        !learningObjectives.every(
          (item) => typeof item === "string"
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Learning objectives must be an array of strings",
        });
      }

      data.learningObjectives = learningObjectives;
    }

    const course = await prisma.course.update({
      where: { id },
      data,
    });

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (err) {
    console.error("Update course error:", err);

    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Course code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


exports.deleteCourse = async (req, res) => {
  // Delete logic goes here
   const id = Number(req.params.id);
   if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid course ID",
    });
  }

  const existingCourse = await prisma.course.findUnique({
  where: { id },
});

if (!existingCourse) {
  return res.status(404).json({
    success: false,
    message: "Course not found",
  });
}

if (existingCourse.teacherId !== req.user.userId) {
  return res.status(403).json({
    success: false,
    message: "You can only delete your own courses",
  });
}

  try{
    const course= await prisma.course.delete({
        where:{id}
    })
    return res.status(201).json({
        success:true,
        message:"Course Deleted",
        course
    })
  }
  catch(err){
    return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const courseId = Number(req.params.id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Get course by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch course details",
    });
  }
};