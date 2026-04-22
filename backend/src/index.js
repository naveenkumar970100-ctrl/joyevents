import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync } from "fs";
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/bookings.js";
import eventRoutes from "./routes/events.js";
import serviceRoutes from "./routes/services.js";
import categoryRoutes from "./routes/categories.js";
import notificationRoutes from "./routes/notifications.js";
import earningsRoutes from "./routes/earnings.js";
import marketingRoutes from "./routes/marketing.js";
import analyticsRoutes from "./routes/analytics.js";
import favoriteRoutes from "./routes/favorites.js";
import settingsRoutes from "./routes/settings.js";
import contactRoutes from "./routes/contact.js";
import recommendationRoutes from "./routes/recommendations.js";
import translateRoutes from "./routes/translate.js";
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
if (!process.env.MONGO_URI) {
  const rootEnv = resolve(__dirname, "../../.env");
  dotenv.config({ path: rootEnv });
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({  
  origin: (origin, callback) => {
    // In production, ALLOWED_ORIGINS env var can restrict to specific domains.
    // Falls back to allowing all origins (safe for APIs that use token auth).
    const allowed = process.env.ALLOWED_ORIGINS;
    if (!allowed) {
      // No restriction configured — allow all (default for dev and single-domain deploys)
      return callback(null, true);
    }
    const list = allowed.split(",").map(o => o.trim());
    if (!origin || list.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Serve uploaded images as static files
app.use("/uploads", express.static(resolve(__dirname, "../uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/earnings", earningsRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/translate", translateRoutes);

// Serve frontend build if it exists (production / single-port mode)
const frontendDist = resolve(__dirname, "../../frontend/dist");
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // Catch-all: return index.html for any non-API route so React Router works on refresh
  app.get("*", (_req, res) => {
    res.sendFile(resolve(frontendDist, "index.html"));
  });
}

async function start() {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`API server running on http://localhost:${PORT}`);
      if (existsSync(frontendDist)) {
        console.log(`Frontend served at http://localhost:${PORT}`);
      }
    });
    
    server.on("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Please close the application using this port and try again.`);
        process.exit(1);
      } else {
        console.error("Server error:", err);
      }
    });

    // Keep process alive — prevent crash on unhandled errors
    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception (server kept alive):", err?.message || err);
    });
    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Rejection (server kept alive):", reason?.message || reason);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

start();

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
