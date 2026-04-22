import { Router } from "express";
import Service from "../models/Service.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { upload } from "../utils/upload.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const router = Router();

// Public: list all active services
router.get("/", async (_req, res) => {
  try {
    const services = await Service.find().populate("createdBy", "name email").sort({ createdAt: -1 });
    res.json({ services });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Merchant: list only their own services
router.get("/my-services", verifyToken, requireRole("merchant"), async (req, res) => {
  try {
    const services = await Service.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Public: get services by merchant ID
router.get("/merchant/:merchantId", async (req, res) => {
  try {
    const services = await Service.find({ createdBy: req.params.merchantId }).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Temporary migration endpoint to assign ownership of legacy services
router.post("/assign-legacy-services", verifyToken, requireRole("merchant"), async (req, res) => {
  try {
    
    // Find services without createdBy
    const legacyServices = await Service.find({ createdBy: { $exists: false } });
    
    if (legacyServices.length > 0) {
      // Assign all legacy services to this merchant
      const result = await Service.updateMany(
        { createdBy: { $exists: false } },
        { $set: { createdBy: req.user._id } }
      );
      
      
      res.json({ 
        message: `Assigned ${result.modifiedCount} legacy services to your account`,
        updatedCount: result.modifiedCount
      });
    } else {
      res.json({ 
        message: "No legacy services found to assign",
        updatedCount: 0
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Public: get single service by ID
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate("createdBy", "name email");
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json({ service });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Merchant/Admin: create service (with optional image and gallery images)
router.post("/", verifyToken, requireRole("merchant", "admin"), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 4 }
]), async (req, res) => {
  try {
    
    const { name, description, price, category, highlights, active } = req.body || {};
    if (!name || !price) return res.status(400).json({ error: "name and price are required" });
    
    // Upload main image to Cloudinary
    let imageUrl = "";
    if (req.files && req.files.image && req.files.image[0]) {
      const cloudinaryResult = await uploadToCloudinary(req.files.image[0].buffer, 'services');
      imageUrl = cloudinaryResult.url;
    }
    
    // Upload gallery images to Cloudinary
    let galleryUrls = [];
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      const uploadPromises = req.files.gallery.map(file => uploadToCloudinary(file.buffer, 'services/gallery'));
      const results = await Promise.all(uploadPromises);
      galleryUrls = results.map(r => r.url);
    }
    
    let parsedHighlights = [];
    if (highlights) {
      try { parsedHighlights = JSON.parse(highlights); } catch { parsedHighlights = [highlights]; }
    }
    let parsedAddOns = [];
    if (req.body.addOns) {
      try { parsedAddOns = JSON.parse(req.body.addOns); } catch { parsedAddOns = []; }
    }
    const service = await Service.create({
      name,
      description: description || "",
      price: Number(price),
      category: category || "General",
      highlights: parsedHighlights,
      image: imageUrl,
      gallery: galleryUrls,
      active: active !== "false",
      addOns: parsedAddOns,
      createdBy: req.user._id
    });
    res.status(201).json({ service });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Merchant/Admin: update service (with optional image and gallery images)
router.patch("/:id", verifyToken, requireRole("merchant", "admin"), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 4 }
]), async (req, res) => {
  try {
    const { name, description, price, category, highlights, active, qrCodeCustomUrl, qrCodeActive } = req.body || {};
    const update = {};
    if (name !== undefined)        update.name = name;
    if (description !== undefined) update.description = description;
    if (price !== undefined)       update.price = Number(price);
    if (category !== undefined)    update.category = category;
    if (active !== undefined)      update.active = active !== "false";
    if (qrCodeCustomUrl !== undefined) update.qrCodeCustomUrl = qrCodeCustomUrl;
    if (qrCodeActive !== undefined) update.qrCodeActive = qrCodeActive;
    
    // Upload new main image to Cloudinary if provided
    if (req.files && req.files.image && req.files.image[0]) {
      const cloudinaryResult = await uploadToCloudinary(req.files.image[0].buffer, 'services');
      update.image = cloudinaryResult.url;
    }
    
    // Upload new gallery images to Cloudinary if provided
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      const uploadPromises = req.files.gallery.map(file => uploadToCloudinary(file.buffer, 'services/gallery'));
      const results = await Promise.all(uploadPromises);
      update.gallery = results.map(r => r.url);
    }
    
    if (highlights !== undefined) {
      try { update.highlights = JSON.parse(highlights); } catch { update.highlights = [highlights]; }
    }
    if (req.body.addOns !== undefined) {
      try { update.addOns = JSON.parse(req.body.addOns); } catch { update.addOns = []; }
    }
    
    // Find service and check ownership
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    
    // Check if user is admin or owner of the service
    if (req.user.role !== "admin" && service.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update this service" });
    }
    
    const updatedService = await Service.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ service: updatedService });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Merchant/Admin: delete service
router.delete("/:id", verifyToken, requireRole("merchant", "admin"), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    
    // Check if user is admin or owner of the service
    if (req.user.role !== "admin" && service.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this service" });
    }
    
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: "Service deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
