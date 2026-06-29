import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { Resend } from "resend";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.RESEND_API_KEY || !process.env.EMAIL_USER) {
  throw new Error("CRITICAL: Resend configurations are missing!");
}

// ─── Security headers ───────────────────────────────────────────
app.use(helmet());

// ─── CORS — only allow your actual frontend origins ──────────────
app.use(cors({
  origin: [
    "http://localhost:5173",                    // local dev
    "https://your-portfolio.vercel.app",        // ← replace with my live URL
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

// ─── Body parser ─────────────────────────────────────────────────
app.use(bodyParser.json());

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
  try {
    console.log(`Sending message via Resend API from: ${from_email}...`);
    const { error } = await resend.emails.send({
      from: "Portfolio Form <onboarding@resend.dev>",
      to: process.env.EMAIL_USER,
      replyTo: from_email,
      subject: `💼 Portfolio Message from ${from_name}`,
      text: `Sender Name: ${from_name}\nSender Email: ${from_email}\n\nMessage:\n${message}`,
    });
    if (error) {
      console.error("Resend API Error:", error);
      return res.status(400).json({ error: error.message });
    }
    console.log("Success! Email delivered via API.");
    return res.status(200).json({ success: true, message: "Email sent successfully!" });
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