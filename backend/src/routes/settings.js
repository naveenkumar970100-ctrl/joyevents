import express from "express";
import Settings from "../models/Settings.js";
import { verifyToken } from "../middleware/auth.js";
import { validateEmail, normalizeEmail } from "../utils/validation.js";

const router = express.Router();

// GET /api/settings/platform — public, returns platformName + supportEmail
router.get("/platform", async (_req, res) => {
  try {
    const [nameDoc, emailDoc] = await Promise.all([
      Settings.findOne({ key: "platformName" }),
      Settings.findOne({ key: "supportEmail" }),
    ]);
    res.json({
      platformName: nameDoc?.value || "JoyEvents",
      supportEmail: emailDoc?.value || "hello@joyevents.com",
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to load settings" });
  }
});

// POST /api/settings/platform — admin only
router.post("/platform", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  const { platformName, supportEmail } = req.body;
  if (!platformName?.trim()) return res.status(400).json({ message: "Platform name required" });
  if (supportEmail?.trim()) {
    const emailErr = validateEmail(supportEmail);
    if (emailErr) return res.status(400).json({ message: emailErr });
  }
  const normalizedSupportEmail = supportEmail?.trim() ? normalizeEmail(supportEmail) : "";
  try {
    await Promise.all([
      Settings.findOneAndUpdate(
        { key: "platformName" },
        { value: platformName.trim() },
        { upsert: true, new: true }
      ),
      Settings.findOneAndUpdate(
        { key: "supportEmail" },
        { value: normalizedSupportEmail },
        { upsert: true, new: true }
      ),
    ]);
    res.json({ success: true, platformName: platformName.trim(), supportEmail: normalizedSupportEmail });
  } catch (e) {
    res.status(500).json({ message: "Failed to save settings" });
  }
});

// GET /api/settings/commission — public, returns current commission rate
router.get("/commission", async (_req, res) => {
  try {
    const commissionDoc = await Settings.findOne({ key: "commissionRate" });
    res.json({ commissionRate: commissionDoc ? Number(commissionDoc.value) : 5 });
  } catch (e) {
    res.status(500).json({ message: "Failed to load commission rate" });
  }
});

// POST /api/settings/commission — admin only
router.post("/commission", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  const commissionRate = Number(req.body.commissionRate);
  if (Number.isNaN(commissionRate)) {
    return res.status(400).json({ message: "Commission rate must be a number" });
  }
  if (commissionRate < 1 || commissionRate > 100) {
    return res.status(400).json({ message: "Commission rate must be between 1 and 100" });
  }

  try {
    await Settings.findOneAndUpdate(
      { key: "commissionRate" },
      { value: commissionRate.toString() },
      { upsert: true, new: true }
    );
    res.json({ success: true, commissionRate });
  } catch (e) {
    res.status(500).json({ message: "Failed to save commission rate" });
  }
});

export default router;
