
const express = require("express");
const router = express.Router();

const {authenticate} = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const {uploadPrivateFile, listPrivateFiles, getPrivateFileDownload,deletePrivateFile,movePrivateFile} = require("../controllers/privateFile.controller");

router.post("/",authenticate,upload.single("file"),uploadPrivateFile);
router.get("/",authenticate,listPrivateFiles);
router.get("/:id/download", authenticate, getPrivateFileDownload);
router.delete("/:id", authenticate, deletePrivateFile);
router.patch("/:id/folder", authenticate, movePrivateFile);

module.exports = router;


