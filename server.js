// Must be the very first import: ES module imports run in order, and
// Routes/posts.js (imported below) pulls in supabaseClient.js, which reads
// process.env at module-load time. If dotenv hadn't loaded .env yet, that
// check would always fail — even with a correctly filled-in .env file.
import "dotenv/config";

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import { Resend } from "resend";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./Routes/auth.js";
import postsRoutes from "./Routes/posts.js";
import projectsRoutes from "./Routes/projects.js";
import videosRoutes from "./Routes/videos.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Startup environment validation ──────────────────────────────
// Fail fast and loud with a specific list of what's missing, rather than
// booting successfully and failing mysteriously on the first real request.
const REQUIRED_ENV_VARS = [
  "RESEND_API_KEY",
  "EMAIL_USER",
  "ADMIN_PASSWORD",
  "JWT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  throw new Error(
    `CRITICAL: Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
}

// ─── Security headers ────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://my-portfolio-navy-alpha-56.vercel.app",
    ],
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body parser, explicit size limit ────────────────────
// 2mb accommodates full blog post content arrays (posts/projects/videos
// PUT payloads). send-email's own payload is separately capped at the
// field level (message max 5000 chars) regardless of this ceiling.
app.use(bodyParser.json({ limit: "2mb" }));

// ─── Rate limiters ───────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages sent. Please try again later." },
});

// ─── Routes ──────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);

// Content collections: GET is public (no auth), PUT is admin-only (JWT
// checked inside each router) with its own independent rate limit.
// See lib/collectionRouter.js for the shared implementation.
app.use("/api/posts", postsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/videos", videosRoutes);

const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/send-email", contactFormLimiter, async (req, res) => {
  const { from_name, from_email, message } = req.body;

  // FIX 1: Input validation ─────────────────────────────────────
  if (!from_name || !from_email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (
    typeof from_name !== "string" ||
    typeof from_email !== "string" ||
    typeof message !== "string"
  ) {
    return res.status(400).json({ error: "Invalid input types." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(from_email)) {
    return res
      .status(400)
      .json({ error: "Please provide a valid email address." });
  }

  if (from_name.trim().length < 1 || from_name.length > 100) {
    return res
      .status(400)
      .json({ error: "Name must be between 1 and 100 characters." });
  }

  if (message.trim().length < 1 || message.length > 5000) {
    return res
      .status(400)
      .json({ error: "Message must be between 1 and 5000 characters." });
  }

  // FIX 2: Strip HTML tags to sanitize input ────────────────────
  const sanitize = (str) => str.replace(/<[^>]*>/g, "").trim();
  const safeName = sanitize(from_name);
  const safeEmail = from_email.trim();
  const safeMessage = sanitize(message);

  try {
    console.log(`Sending message via Resend API from: ${safeEmail}...`);
    const { error } = await resend.emails.send({
      from: "Portfolio Form <onboarding@resend.dev>",
      to: process.env.EMAIL_USER,
      replyTo: safeEmail,
      subject: `💼 Portfolio Message from ${safeName}`,
      text: `Sender Name: ${safeName}\nSender Email: ${safeEmail}\n\nMessage:\n${safeMessage}`,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("Success! Email delivered via API.");
    return res
      .status(200)
      .json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("❌ SERVER EXCEPTION:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
});

app.get("/", (req, res) => {
  res.send("🚀 Portfolio Backend is active and running via Resend API!");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
