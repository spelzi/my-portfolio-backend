import nodemailer from "nodemailer";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error("Email credentials missing");
}

app.use(cors());
app.use(bodyParser.json());

// Rate limit: max 5 contact-form submissions per IP every 15 minutes.
// Protects the Gmail account from being flagged for unusual sending activity
// and stops the endpoint being used as a free spam relay.
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

// Validates the request body before it ever reaches Nodemailer.
// The frontend already validates this, but this endpoint can be called
// directly (Postman, curl, etc.), so it can't rely on that alone.
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

// Email route
app.post(
  "/send-email",
  contactFormLimiter,
  validateContactForm,
  async (req, res) => {
    const { from_name, from_email, message } = req.body;

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // send to yourself
        subject: `Message from ${from_name}`,
        text: `Email: ${from_email}\n\nMessage:\n${message}`,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Email sent successfully!" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  },
);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
