
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.getProfile =  async (req, res)=> {
  try {

    const userId = Number(req.user.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid authenticated user",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { studentProfile, ...userDetails } = user;

    return res.json({
      ...userDetails,
      profile: studentProfile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
}


exports.updateProfile =  async (req, res)=> {
  try {
    const userId = Number(req.user.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid authenticated user",
      });
    }

    const {
      phone,
      dob,
      gender,
      bloodGroup,
      bio,
      avatar,
      street,
      city,
      state,
      pincode,
      emergencyContactName,
      emergencyPhone,
    } = req.body;


    let parsedDob = null;

    if (dob) {
      parsedDob = new Date(dob);

      if (Number.isNaN(parsedDob.getTime())) {
        return res.status(400).json({
          message: "Invalid date of birth",
        });
      }
    }

    const profile = await prisma.studentProfile.upsert({
      where: { userId },
      create: {
        userId,
        phone: phone || null,
        dob: parsedDob,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        bio: bio || null,
        avatar: avatar || null,
        street: street || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        emergencyContactName: emergencyContactName || null,
        emergencyPhone: emergencyPhone || null,
      },
      update: {
        phone: phone || null,
        dob: parsedDob,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        bio: bio || null,
        avatar: avatar || null,
        street: street || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        emergencyContactName: emergencyContactName || null,
        emergencyPhone: emergencyPhone || null,
      },
    });

    return res.json({
      message: "Profile saved successfully",
      profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
}
