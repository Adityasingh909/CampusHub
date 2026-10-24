const express= require("express")
const router = express.Router()

const {authenticate} =  require("../middleware/auth.middleware");
const {getProfile,updateProfile} = require("../controllers/profile.controller");

// console.log("authenticate:", typeof authenticate);
// console.log("getProfile:", typeof getProfile);
// console.log("updateProfile:", typeof updateProfile);
router.get("/",authenticate,getProfile)
router.put("/",authenticate,updateProfile)

module.exports= router;