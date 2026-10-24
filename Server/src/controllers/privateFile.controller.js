const crypto = require("crypto");
const path = require("path");

const {PutObjectCommand,DeleteObjectCommand,GetObjectCommand} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const r2 = require("../config/r2");
const prisma = require("../config/prisma");

// Upload a file
exports.uploadPrivateFile= async(req, res) =>{
  let storageKey;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file to upload.",
      });
    }

    // Your JWT middleware uses userId.
    const userId = Number(req.user?.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const folderId = req.body.folderId
      ? Number(req.body.folderId)
      : null;

    if (
      req.body.folderId &&
      (!Number.isInteger(folderId) || folderId <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid folder ID.",
      });
    }

    // A user may upload only into their own folder.
    if (folderId !== null) {
      const folder = await prisma.privateFolder.findFirst({
        where: { id: folderId, userId },
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found.",
        });
      }
    }

    const extension = path.extname(req.file.originalname);
    const safeExtension = extension
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "");

    storageKey = `private/${userId}/${crypto.randomUUID()}${safeExtension}`;

    // 1. Upload the actual file to Cloudflare R2.
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: storageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    // 2. Save metadata in PostgreSQL.
    const savedFile = await prisma.privateFile.create({
      data: {
        originalName: req.file.originalname,
        storageKey,
        mimeType: req.file.mimetype,
        size: req.file.size,
        userId,
        folderId,
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        folderId: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully.",
      file: savedFile,
    });
  } catch (error) {
    // Avoid leaving an orphaned R2 object if the DB write fails.
    if (storageKey) {
      try {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: storageKey,
          })
        );
      } catch (cleanupError) {
        console.error("R2 cleanup failed:", cleanupError.message);
      }
    }

    console.error("File upload failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to upload file.",
    });
  }
}

exports.listPrivateFiles = async(req,res)=>{
    try{
            const userId =Number(req.user.userId)
             if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const files = await prisma.privateFile.findMany({
        where:{userId},
        orderBy: { createdAt: "desc" },
        select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        folderId: true,
        createdAt: true,
      },
    })

    return res.status(200).json({
      success: true,
      count: files.length,
      files,
    });

    }
    catch(error){
             console.error("List files failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve files.",
    });
    }
}



exports.getPrivateFileDownload= async(req, res) =>{
  try {
    const userId = Number(req.user?.userId);
    const fileId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!Number.isInteger(fileId) || fileId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID.",
      });
    }

    // Find only a file owned by the logged-in user.
    const file = await prisma.privateFile.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    // Create a temporary URL that expires after 60 seconds.
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: file.storageKey,
      ResponseContentDisposition: "attachment",
    });

    const downloadUrl = await getSignedUrl(r2, command, {
      expiresIn: 60,
    });

    return res.status(200).json({
      success: true,
      downloadUrl,
    });
  } catch (error) {
    console.error("Download URL generation failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to generate download link.",
    });
  }
}




exports.deletePrivateFile = async(req, res)=> {
  try {
    const userId = Number(req.user?.userId);
    const fileId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!Number.isInteger(fileId) || fileId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID.",
      });
    }

    // Find the file only if it belongs to this user.
    const file = await prisma.privateFile.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    // Delete the actual object from R2 first.
    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: file.storageKey,
      })
    );

    // Delete its metadata from PostgreSQL.
    await prisma.privateFile.delete({
      where: { id: file.id },
    });

    return res.status(200).json({
      success: true,
      message: "File deleted successfully.",
    });
  } catch (error) {
    console.error("Delete file failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete file.",
    });
  }
}




exports.movePrivateFile= async(req, res) =>{
  try {
    const userId = Number(req.user?.userId);
    const fileId = Number(req.params.id);
    const folderId =
      req.body.folderId === null || req.body.folderId === ""
        ? null
        : Number(req.body.folderId);

    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !Number.isInteger(fileId) ||
      fileId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or file ID.",
      });
    }

    if (
      folderId !== null &&
      (!Number.isInteger(folderId) || folderId <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid folder ID.",
      });
    }

    // Confirm the file belongs to the authenticated user.
    const file = await prisma.privateFile.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    // If a folder was provided, confirm its ownership.
    if (folderId !== null) {
      const folder = await prisma.privateFolder.findFirst({
        where: { id: folderId, userId },
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found.",
        });
      }
    }

    const updatedFile = await prisma.privateFile.update({
      where: { id: fileId },
      data: { folderId },
      select: {
        id: true,
        originalName: true,
        folderId: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: folderId === null
        ? "File moved to the root directory."
        : "File moved successfully.",
      file: updatedFile,
    });
  } catch (error) {
    console.error("Move file failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to move file.",
    });
  }
}
