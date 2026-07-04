import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { Resend } from "resend";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./Routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.RESEND_API_KEY || !process.env.EMAIL_USER) {
  throw new Error("CRITICAL: Resend configurations are missing!");
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
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);

// ─── Body parser, explicit size limit ────────────────────
app.use(bodyParser.json({ limit: "20kb" }));

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
