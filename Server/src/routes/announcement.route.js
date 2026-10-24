const  express = require("express");
const router = express.Router()
const {getCourseAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement} = require("../controllers/announcement.controller")
const { authenticate } = require("../middleware/auth.middleware");

router.get("/courses/:courseId/announcements",authenticate,getCourseAnnouncements)
router.post("/courses/:courseId/announcements",authenticate,createAnnouncement)
router.put("/announcements/:id",authenticate,updateAnnouncement)
router.delete("/announcements/:id",authenticate,deleteAnnouncement)


module.exports = router; 