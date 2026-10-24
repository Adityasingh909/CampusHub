
const multer = require("multer");
const path = require("path");

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "text/plain",
  "text/javascript",
  "application/javascript",
  "text/css",
  "text/html",
  "application/json",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("This file type is not supported."));
    }

    cb(null, true);
  },
});

module.exports = upload;
