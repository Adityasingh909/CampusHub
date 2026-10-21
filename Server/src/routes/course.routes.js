const  express = require("express");
const router = express.Router()
const {getCourses,createCourse, updateCourse, deleteCourse, getCourseById} = require("../controllers/course.controller");
const { authenticate, authorizeTeacher } = require("../middleware/auth.middleware");


router.get('/',getCourses);
router.get('/:id',getCourseById);
router.post('/',authenticate,authorizeTeacher,createCourse)
router.put('/:id',authenticate,authorizeTeacher,updateCourse)
router.delete('/:id',authenticate,authorizeTeacher,deleteCourse)
router.put("/:id", authenticate,authorizeTeacher,updateCourse);

module.exports = router;