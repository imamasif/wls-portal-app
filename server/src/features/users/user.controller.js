import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { userUseCase, UserMapper, UserModel } from "./index.js";
import { UserRole } from "../types/user.ts";
import { sendPasswordResetEmail } from "../../common/services/email.service.js";

const router = express.Router();

const findUserByIdOrEmail = async (paramId, selectPassword = false) => {
  const filter = mongoose.Types.ObjectId.isValid(paramId)
    ? { _id: paramId }
    : { email: decodeURIComponent(paramId).toLowerCase().trim() };

  const query = UserModel.findOne(filter);
  if (selectPassword) query.select("+password");
  return await query;
};

const appendAuditLog = (userDoc, action, performedBy, details) => {
  if (!userDoc.auditTrail) userDoc.auditTrail = [];
  userDoc.auditTrail.push({
    action,
    performedBy: performedBy || "System/Admin",
    performedAt: new Date(),
    details: details || "",
  });
  userDoc.updatedBy = performedBy || "System/Admin";
};

router.get("/", async (req, res) => {
  try {
    const users = await userUseCase.getAllUsers();
    res.json(UserMapper.toResDTOList ? UserMapper.toResDTOList(users) : users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      groupNumbers,
      groupNumber,
      phones,
      profession,
      education,
      country,
      countryCode,
      state,
      stateCode,
      city,
      drive,
      gender,
      driveFolderPath,
      causeContribution,
      profilePictureUrl,
      socialMedia,
    } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required for registration." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "An account with this email already exists." });
    }

    const validSocialMedia = Array.isArray(socialMedia)
      ? socialMedia.filter(
          (item) => item && item.handleUrl && item.handleUrl.trim() !== "",
        )
      : [];

    // Support both multi-group array and legacy single groupNumber
    const assignedGroups =
      Array.isArray(groupNumbers) && groupNumbers.length > 0
        ? groupNumbers
        : [groupNumber || 1];

    const newUser = await UserModel.create({
      email: cleanEmail,
      password: password,
      name: name || cleanEmail.split("@")[0],
      role: "USER",
      gender: gender || "",
      groupNumbers: assignedGroups,
      phones: Array.isArray(phones) ? phones : [],
      phone: phones && phones[0] ? phones[0].number : "",
      profession: profession || "",
      education: education || "",
      country: country || "Canada",
      countryCode: countryCode || "CA",
      state: state || "",
      stateCode: stateCode || "",
      city: city || "Toronto",
      drive: driveFolderPath || drive || "",
      driveFolderPath: driveFolderPath || drive || "",
      causeContribution: causeContribution || "",
      profilePictureUrl: profilePictureUrl || "",
      socialMedia: validSocialMedia,
      createdBy: cleanEmail,
      updatedBy: cleanEmail,
      auditTrail: [
        {
          action: "USER_REGISTERED",
          performedBy: cleanEmail,
          performedAt: new Date(),
          details: "Account created",
        },
      ],
    });

    const resDto = UserMapper.toResDTO
      ? UserMapper.toResDTO(newUser)
      : newUser.toObject();
    res.status(201).json(resDto);
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: cleanEmail }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        error: "Account is disabled. Please contact an administrator.",
      });
    }

    if (!user.password) {
      return res
        .status(401)
        .json({ error: "Account password not configured properly." });
    }

    let isMatch = await bcrypt.compare(
      String(password),
      String(user.password),
    );
    if (!isMatch && String(password).trim() !== String(password)) {
      isMatch = await bcrypt.compare(
        String(password).trim(),
        String(user.password),
      );
    }
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const userObj = user.toObject();
    delete userObj.password;

    const resDto = UserMapper.toResDTO ? UserMapper.toResDTO(userObj) : userObj;
    return res.status(200).json(resDto);
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const user = await UserModel.findOne({ email: cleanEmail });

    // If user not found, return standard generic message for security
    if (!user) {
      return res.status(200).json({
        message: "If an account with that email exists, password reset instructions have been sent to your inbox.",
      });
    }

    // Generate secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    appendAuditLog(
      user,
      "FORGOT_PASSWORD_REQUESTED",
      cleanEmail,
      "Password reset token requested"
    );
    await user.save();

    // Determine client URL (prioritizes explicitly configured CLIENT_URL, fallback to request origin)
    let rawOrigin =
      process.env.CLIENT_URL ||
      req.headers.origin ||
      req.headers.referer ||
      "http://localhost:5173";

    rawOrigin = String(rawOrigin).trim().replace(/\/+$/, "");
    if (!rawOrigin.startsWith("http://") && !rawOrigin.startsWith("https://")) {
      rawOrigin = `https://${rawOrigin}`;
    }
    const resetUrl = `${rawOrigin}/?resetToken=${rawToken}`;

    // Send email via email service
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      userName: user.name || "User",
      resetUrl,
    });

    return res.status(200).json({
      message: "If an account with that email exists, password reset instructions have been sent to your inbox.",
      simulated: emailResult.simulated,
      devResetUrl: emailResult.simulated ? resetUrl : undefined,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Failed to process password reset request." });
  }
});

router.get("/verify-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ valid: false, error: "Reset token is required." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        valid: false,
        error: "Password reset link is invalid or has expired. Please request a new one.",
      });
    }

    return res.status(200).json({
      valid: true,
      email: user.email,
      name: user.name,
    });
  } catch (err) {
    console.error("Verify reset token error:", err);
    return res.status(500).json({ valid: false, error: "Failed to verify reset token." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        error: "Password reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    appendAuditLog(
      user,
      "PASSWORD_RESET_SUCCESS",
      user.email,
      "Password updated via reset token link"
    );
    await user.save();

    return res.status(200).json({
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Failed to reset password." });
  }
});

router.put("/:id/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword, isAdminReset, performerEmail } =
      req.body;
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required." });
    }

    const user = await findUserByIdOrEmail(req.params.id, true);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!isAdminReset) {
      if (!currentPassword || !user.password) {
        return res
          .status(400)
          .json({ message: "Current password is required." });
      }
      const isMatch = await bcrypt.compare(
        String(currentPassword),
        String(user.password),
      );
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect." });
      }
    }

    user.password = newPassword;

    appendAuditLog(
      user,
      isAdminReset ? "ADMIN_PASSWORD_RESET" : "SELF_PASSWORD_CHANGE",
      performerEmail || user.email,
      "Password updated",
    );
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const { isActive, performerEmail } = req.body;
    const user = await findUserByIdOrEmail(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    user.isActive = isActive;
    appendAuditLog(
      user,
      isActive ? "ENABLE_ACCOUNT" : "DISABLE_ACCOUNT",
      performerEmail,
      `User account status changed to ${isActive ? "Active" : "Inactive"}`,
    );
    await user.save();

    const resDto = UserMapper.toResDTO
      ? UserMapper.toResDTO(user)
      : user.toObject();
    res.status(200).json(resDto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/radar", async (req, res) => {
  try {
    const { underRadar, radarReason, performerEmail } = req.body;
    const user = await findUserByIdOrEmail(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    user.underRadar = Boolean(underRadar);
    user.radarReason = underRadar ? radarReason || "" : "";
    appendAuditLog(
      user,
      underRadar ? "MARK_UNDER_RADAR" : "UNMARK_UNDER_RADAR",
      performerEmail,
      underRadar ? `Flagged: ${radarReason}` : "Radar flag cleared",
    );
    await user.save();

    const resDto = UserMapper.toResDTO
      ? UserMapper.toResDTO(user)
      : user.toObject();
    res.status(200).json(resDto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = await findUserByIdOrEmail(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    await UserModel.deleteOne({ _id: user._id });
    res.status(200).json({ message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const body = req.body;
    const user = await findUserByIdOrEmail(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const phones = Array.isArray(body.phones) ? body.phones : [];
    const primaryObj = phones.find((p) => p.isPrimary) || phones[0];
    const legacyPhone = primaryObj ? primaryObj.number : body.phone || "";

    const validSocialMedia = Array.isArray(body.socialMedia)
      ? body.socialMedia.filter(
          (item) => item && item.handleUrl && item.handleUrl.trim() !== "",
        )
      : [];

    user.name = body.name ?? user.name;
    user.email = body.email ? body.email.toLowerCase().trim() : user.email;

    // --- ROBUST ROLE VALIDATION GUARD ---
    const allowedRoles = Object.values(UserRole); // ['SUPER_USER', 'WLS_ADMIN', 'USER']

    if (body.role !== undefined) {
      if (allowedRoles.includes(body.role)) {
        user.role = body.role;
      } else if (!body.role) {
        user.role = UserRole.USER;
      }
    }

    user.gender = body.gender ?? user.gender;

    if (Array.isArray(body.groupNumbers)) {
      user.groupNumbers = body.groupNumbers;
    }

    user.phones = phones;
    user.phone = legacyPhone;
    user.profession = body.profession ?? user.profession;
    user.education = body.education ?? user.education;
    user.country = body.country ?? user.country;
    user.countryCode = body.countryCode ?? user.countryCode;
    user.state = body.state ?? user.state;
    user.stateCode = body.stateCode ?? user.stateCode;
    user.city = body.city ?? user.city;
    user.drive = body.driveFolderPath || body.drive || user.drive;
    user.driveFolderPath =
      body.driveFolderPath || body.drive || user.driveFolderPath;
    user.causeContribution = body.causeContribution ?? user.causeContribution;
    user.profilePictureUrl = body.profilePictureUrl ?? user.profilePictureUrl;
    user.socialMedia = validSocialMedia;

    appendAuditLog(
      user,
      "UPDATE_PROFILE",
      body.performerEmail,
      "Profile details updated",
    );
    await user.save();

    const resDto = UserMapper.toResDTO
      ? UserMapper.toResDTO(user)
      : user.toObject();
    return res.status(200).json(resDto);
  } catch (err) {
    console.error("Error updating user profile:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
