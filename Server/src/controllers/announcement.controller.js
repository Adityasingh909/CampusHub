const prisma = require("../config/prisma");
const { connect } = require("../routes/announcement.route");

exports.getCourseAnnouncements = async (req, res) => {
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
      select: { id: true },
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course not found!",
      });
    }

    const announcements = await prisma.announcement.findMany({
      where: { courseId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error(error);
    return res.status(404).json({
      success: false,
      message: "Internal server error ",
    });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const { title, message, priority } = req.body;
    // console.log("Route params:", req.params);
    // console.log("Parsed courseId:", courseId);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }
    if (!["NORMAL", "IMPORTANT"].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Priority must be NORMAL or IMPORTANT",
      });
    }
    const authorId = req.user.userId;

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        teacherId: true,
      },
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course not found!",
      });
    }

//     console.log("Course ID:", course.id);
// console.log("Course teacher ID:", course.teacherId);
// console.log("Authenticated user ID:", authorId);
// console.log("Authenticated user role:", req.user.role);

    if (course.teacherId !== authorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage this course",
      });
    }

    const announcements = await prisma.announcement.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        priority,
        course: { connect: { id: courseId } },
        author: { connect: { id: authorId } },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error(error);
    return res.status(404).json({
      success: false,
      message: "Internal server error ",
    });
  }
};


exports.updateAnnouncement = async (req, res) => {
  try {
    const announcementId = Number(req.params.id);
    const { title, message, priority } = req.body;

    // 1. Validate announcement ID
    if (!Number.isInteger(announcementId) || announcementId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID",
      });
    }

    // 2. Validate input
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    if (!["NORMAL", "IMPORTANT"].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Priority must be NORMAL or IMPORTANT",
      });
    }

    // 3. Get the authenticated user ID
    const authorId = req.user.userId;

    // 4. Find the announcement and its course
    const existingAnnouncement =
      await prisma.announcement.findUnique({
        where: { id: announcementId },
        include: {
          course: {
            select: {
              id: true,
              teacherId: true,
            },
          },
        },
      });

    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }


    if (existingAnnouncement.course.teacherId !== authorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this announcement",
      });
    }

    
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        title: title.trim(),
        message: message.trim(),
        priority,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      announcement: updatedAnnouncement,
    });
  } catch (error) {
    console.error("Update announcement error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update announcement",
    });
  }
};



exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcementId = Number(req.params.id);

    // 1. Validate the ID
    if (!Number.isInteger(announcementId) || announcementId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID",
      });
    }

    // 2. Get the authenticated user
    const authorId = req.user.userId;

    // 3. Find the announcement and its course
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        course: {
          select: {
            id: true,
            teacherId: true,
          },
        },
      },
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // 4. Verify that the user teaches this course
    if (announcement.course.teacherId !== authorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this announcement",
      });
    }

    // 5. Delete the record
    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Delete announcement error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
    });
  }
};
