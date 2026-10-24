
const express = require("express");
const router = express.Router();

const {authenticate} = require("../middleware/auth.middleware");
const {createPrivateFolder,listPrivateFolders} = require("../controllers/privateFolder.controller");

router.post("/", authenticate, createPrivateFolder);
router.get("/", authenticate, listPrivateFolders);

module.exports = router;
