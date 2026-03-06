import User from "../models/User.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";
import { resolveAccessContextForUser } from "../services/accessControlService.js";

const normalizeAllergyList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

// 🔑 Helper to generate JWT
const generateToken = async (userId) => {
  try {
    const user = await User.findById(userId).select("role isAdmin accessRoleKey permissions");
    const accessContext = user ? await resolveAccessContextForUser(user, { persistRoleKey: true }) : null;
    const tokenExpiresIn = process.env.JWT_EXPIRES_IN || "14d";
    return jwt.sign(
      {
        id: userId,
        role: user?.role || "customer",
        isAdmin: user?.isAdmin || false,
        accessRoleKey: accessContext?.roleKey || user?.accessRoleKey || null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: tokenExpiresIn,
      }
    );
  } catch (error) {
    console.error("Error generating token:", error);
    // Fallback to basic token if user fetch fails
    const tokenExpiresIn = process.env.JWT_EXPIRES_IN || "14d";
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiresIn }
    );
  }
};

// 👤 Register a new user
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = await generateToken(user._id);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user).catch((err) => {
      console.error("Failed to send welcome email:", err);
      // Don't fail registration if email fails
    });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during registration" });
  }
};

// 🔐 Login existing user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = await generateToken(user._id);

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login" });
  }
};

// 🔑 Forgot Password - Request password reset
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return res.status(200).json({
        message: "If an account exists with that email, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = PasswordResetToken.generateToken();

    // Create password reset token document
    await PasswordResetToken.create({
      user: user._id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Send password reset email
    await sendPasswordResetEmail(user, resetToken).catch((err) => {
      console.error("Failed to send password reset email:", err);
      // Continue even if email fails
    });

    res.status(200).json({
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

// 🔑 Reset Password - Set new password with token
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Find valid token
    const resetTokenDoc = await PasswordResetToken.findValidToken(token);
    
    if (!resetTokenDoc) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Get user
    const user = await User.findById(resetTokenDoc.user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Mark token as used
    resetTokenDoc.used = true;
    await resetTokenDoc.save();

    // Invalidate all other reset tokens for this user (optional security measure)
    await PasswordResetToken.updateMany(
      { user: user._id, used: false },
      { used: true }
    );

    res.status(200).json({
      message: "Password reset successfully. You can now login with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const accessContext = req.accessContext ?? (await resolveAccessContextForUser(user, { persistRoleKey: true }));
    const userObj = user.toObject();
    res.status(200).json({
      ...userObj,
      accessRoleKey: accessContext.roleKey,
      roleName: accessContext.roleName,
      permissions: accessContext.permissions,
      navPolicy: accessContext.navPolicy,
      settingsVersion: accessContext.settingsVersion,
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
};

/**
 * Update current user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, allergyPreferences, allergies, allergyNotes } = req.body;
    const userId = req.user._id;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (allergyPreferences || allergies || allergyNotes !== undefined) {
      const incomingAllergies = normalizeAllergyList(
        allergyPreferences?.allergies ?? allergies
      );
      const incomingNotes =
        allergyPreferences?.notes !== undefined
          ? allergyPreferences.notes
          : allergyNotes;

      updateData.allergyPreferences = {
        allergies: incomingAllergies,
        notes: incomingNotes !== undefined ? String(incomingNotes || "").trim() : "",
      };
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};
