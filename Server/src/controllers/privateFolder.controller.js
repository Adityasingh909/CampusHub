
const prisma = require("../config/prisma");

// Create a folder
exports.createPrivateFolder= async(req, res)=> {
  try {
    const userId = Number(req.user?.userId);
    const name =
      typeof req.body.name === "string"
        ? req.body.name.trim()
        : "";

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!name || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Folder name must be 1–100 characters.",
      });
    }

    const folder = await prisma.privateFolder.create({
      data: {
        name,
        userId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Folder created successfully.",
      folder,
    });
  } catch (error) {
    // Prisma P2002 means a unique constraint was violated.
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A folder with this name already exists.",
      });
    }

    console.error("Create folder failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create folder.",
    });
  }
}



exports.listPrivateFolders= async(req, res) =>{
  try {
    const userId = Number(req.user?.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const folders = await prisma.privateFolder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { files: true },
        },
      },
    });

    const formattedFolders = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      createdAt: folder.createdAt,
      fileCount: folder._count.files,
    }));

    return res.status(200).json({
      success: true,
      count: formattedFolders.length,
      folders: formattedFolders,
    });
  } catch (error) {
    console.error("List folders failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve folders.",
    });
  }
}

