const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/email");
const crypto = require("crypto");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a name, valid email, and password of at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const existingPending = await prisma.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    // Prevent repeated OTP emails within 60 seconds.
    if (
      existingPending &&
      Date.now() - existingPending.updatedAt.getTime() < 60_000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP.",
      });
    }

   const otp = require("crypto")
  .randomBytes(4)
  .readUInt32BE(0);

const otpString = (100000 + (otp % 900000)).toString();
    const passwordHash = await bcrypt.hash(password, 10);
    const otpHash = hashOtp(normalizedEmail, otpString);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendingRegistration.upsert({
      where: { email: normalizedEmail },
      update: {
        name: name.trim(),
        passwordHash,
        otpHash,
        expiresAt,
        attempts: 0,
      },
      create: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    try {
      await sendOtpEmail(normalizedEmail, otpString);
    } catch (emailError) {
      await prisma.pendingRegistration
        .delete({ where: { email: normalizedEmail } })
        .catch(() => {});

      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email. It expires in 10 minutes.",
    });
  } catch (error) {
    console.error("Registration OTP failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to start registration. Please try again later.",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(400).json({
        message: "User not registerd",
        success: false,
      });
    }
    const istrue = await bcrypt.compare(password, user.password);
    if (!istrue) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }
    // generate token
    const payload = {
      userId: user.id,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token expires in 1 hour
    });
    return res.status(200).json({
      message: "Login Successfull",
      success: true,
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login failed", error);

    return res.status(500).json({
      message: "Internal sever error",
      success: false,
    });
  }
};

function hashOtp(email, otp) {
  const secret = process.env.OTP_SECRET;

  if (!secret) {
    throw new Error("OTP_SECRET is not configured");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${email}:${otp}`)
    .digest("hex");
}



exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (
      typeof email !== "string" ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid six-digit OTP.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "Registration not found. Please register again.",
      });
    }

    if (pending.expiresAt <= new Date()) {
      await prisma.pendingRegistration.deleteMany({
        where: { email: normalizedEmail },
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please register again.",
      });
    }

    if (pending.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please register again.",
      });
    }

    const expectedHash = Buffer.from(pending.otpHash, "hex");
    const actualHash = Buffer.from(hashOtp(normalizedEmail, otp), "hex");

    const isValid =
      expectedHash.length === actualHash.length &&
      crypto.timingSafeEqual(expectedHash, actualHash);

    if (!isValid) {
      await prisma.pendingRegistration.update({
        where: { email: normalizedEmail },
        data: { attempts: { increment: 1 } },
      });

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
      });
    }

    const user = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new Error("USER_ALREADY_EXISTS");
      }

      const createdUser = await tx.user.create({
        data: {
          name: pending.name,
          email: normalizedEmail,
          password: pending.passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      await tx.pendingRegistration.delete({
        where: { email: normalizedEmail },
      });

      return createdUser;
    });

    return res.status(201).json({
      success: true,
      message: "Email verified and account created successfully.",
      user,
    });
  } catch (error) {
    if (error.message === "USER_ALREADY_EXISTS") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("OTP verification failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP. Please try again.",
    });
  }
};
