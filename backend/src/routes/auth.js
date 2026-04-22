import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { sendMerchantCredentials, sendPasswordResetEmail } from "../utils/sendEmail.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }
    // Only allow standard users to register publicly
    const userRole = "user";
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: userRole });
    const safeUser = { 
      _id: user._id,
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    let token;
    const secret = process.env.JWT_SECRET;
    if (secret) {
      token = jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, secret, { expiresIn: "7d" });
    }
    return res.status(201).json({ user: safeUser, token });
  } catch (err) {
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const safeUser = { 
      _id: user._id,
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    let token;
    const secret = process.env.JWT_SECRET;
    if (secret) {
      token = jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, secret, { expiresIn: "7d" });
    }
    return res.json({ user: safeUser, token });
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  res.json({ user: req.user });
});

// Verify token endpoint - used by frontend to validate stored tokens
router.get("/verify", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    const safeUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    res.json({ user: safeUser });
  } catch (err) {
    res.status(401).json({ error: "Token verification failed" });
  }
});

router.post("/users", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = ["user", "merchant", "admin"].includes(role) ? role : "user";
    const user = await User.create({ name, email, passwordHash, role: assignedRole });
    const safeUser = { 
      _id: user._id,
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    if (assignedRole === "merchant") {
      // Send the random generation credential to the new email address
      await sendMerchantCredentials({ name, email, password });
    }

    return res.status(201).json({ user: safeUser, message: "User created successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create user" });
  }
});

router.get("/only-user", verifyToken, requireRole("user", "merchant", "admin"), (_req, res) => {
  res.json({ ok: true, role: "user|merchant|admin" });
});

router.get("/only-merchant", verifyToken, requireRole("merchant", "admin"), (_req, res) => {
  res.json({ ok: true, role: "merchant|admin" });
});

router.get("/only-admin", verifyToken, requireRole("admin"), (_req, res) => {
  res.json({ ok: true, role: "admin" });
});

router.get("/users", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.patch("/users/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, role, status } = req.body || {};
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (status) updates.status = status;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// User: Update own profile (name only)
router.patch("/profile", verifyToken, async (req, res) => {
  try {
    const { name } = req.body || {};
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { name: name.trim() }, 
      { new: true }
    ).select("-passwordHash");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const safeUser = { 
      _id: user._id,
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.delete("/users/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
   const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Change password endpoint
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();
    
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Admin: Reset password for any user
router.patch("/admin/reset-password/:userId", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.userId;
    
    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Hash and update new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();
    
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Test endpoint for debugging
router.get("/test", (req, res) => {
 res.json({ 
   message: "Auth routes are working",
    timestamp: new Date().toISOString()
  });
});

// Test profile route accessibility
router.get("/profile-test", (req, res) => {
  res.json({ 
    message: "Profile route is accessible",
    timestamp: new Date().toISOString()
  });
});

// Forgot password — send reset email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, redirect } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    // Always respond OK to prevent email enumeration
    if (!user) return res.json({ message: "If that email exists, a reset link has been sent." });

    // Generate a secure token valid for 1 hour
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}${redirect ? `&redirect=${encodeURIComponent(String(redirect))}` : ""}`;

    await sendPasswordResetEmail({ name: user.name, email: user.email, resetUrl });
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("forgot-password error:", err.message);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

// Reset password — verify token and set new password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) return res.status(400).json({ error: "Token and new password are required" });
    if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ error: "Reset link is invalid or has expired" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
