import nodemailer from "nodemailer";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Validate setup immediately on startup
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error(
    "CRITICAL: EMAIL_USER or EMAIL_PASS environment variables are missing!",
  );
}

app.use(cors());
app.use(bodyParser.json());

// Rate limit: max 5 contact-form submissions per IP every 15 minutes.
const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages sent. Please try again later." },
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

// Input Validation Middleware
function validateContactForm(req, res, next) {
  const { from_name, from_email, message } = req.body ?? {};
  const errors = [];

  if (typeof from_name !== "string" || !from_name.trim()) {
    errors.push("Name is required.");
  } else if (from_name.length > MAX_NAME_LENGTH) {
    errors.push(`Name must be under ${MAX_NAME_LENGTH} characters.`);
  }

  if (typeof from_email !== "string" || !from_email.trim()) {
    errors.push("Email is required.");
  } else if (!EMAIL_REGEX.test(from_email)) {
    errors.push("Please provide a valid email address.");
  }

  if (typeof message !== "string" || !message.trim()) {
    errors.push("Message is required.");
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    errors.push(`Message must be under ${MAX_MESSAGE_LENGTH} characters.`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  next();
}

//Explicit connection configuration to avoid 499 timeouts on cloud hosts
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // Secure SMTPS port
  secure: true, // Set to true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 5000, // Close connection if hanging over 5s
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

// Email route
app.post(
  "/send-email",
  contactFormLimiter,
  validateContactForm,
  async (req, res) => {
    const { from_name, from_email, message } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: from_email,
      subject: ` Portfolio Message from ${from_name}`,
      text: `Sender Name: ${from_name}\nSender Email: ${from_email}\n\nMessage:\n${message}`,
    };

    try {
      console.log(`[SMTP] Sending message from: ${from_email}...`);

      await transporter.sendMail(mailOptions);

      console.log("[SMTP] Success! Email delivered.");
      return res
        .status(200)
        .json({ success: true, message: "Email sent successfully!" });
    } catch (error) {
      console.error(" NODEMAILER FAILURE DETAILS:", error);

      return res.status(500).json({
        error: "Failed to send email",
        details: error.message,
      });
    }
  },
);

// Fallback health check route to verify deployment state easily via browser
app.get("/", (req, res) => {
  res.send("Portfolio Backend is active and running perfectly!");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
