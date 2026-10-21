
const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Bearer token required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};



exports.authorizeTeacher = (req, res, next) => {
  if (req.user.role !== "TEACHER") {
    return res.status(403).json({
      success: false,
      message: "Only teachers can manage courses",
    });
  }

  next();
};

exports.authorizeStudent = (req, res, next) => {
  if (req.user.role !== "STUDENT") {
    return res.status(403).json({
      success: false,
      message: "Only students can access enrollments",
    });
  }

  next();
};