# 📩 Portfolio Backend – Contact Form API

This is the **backend server** for my portfolio website.
It handles sending contact form messages securely using **Node.js, Express, and Nodemailer**.

---

## 🚀 Features

- REST API built with **Express.js**
- Handles **contact form submissions** from the frontend
- Uses **Resend API** for email delivery
- Built-in network connection timeouts (5 seconds) to prevent server hangs (`499 Client Closed Request` errors)
- Secrets safely stored in `.env` file locally and configured via cloud variables in production (never committed to GitHub)
- CORS enabled to allow cross-origin frontend requests
- **Rate limited** — max 5 submissions per IP per 15 minutes to prevent spam relay abuse
- **Server-side validation** on data types, email regex patterns, and string length restrictions (`MAX_MESSAGE_LENGTH: 5000`)
- **Automated Reply Handling** via `replyTo` configuration headers, ensuring native email replies route back to your visitor instead of yourself
- Explicit startup environment validation to immediately identify missing variables.

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- Resend API
- dotenv
- CORS
- express-rate-limit

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/spelzi/my-portfolio-backend.git
cd my-portfolio-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a .env file in the project root

Copy `.env.example` to `.env` and fill in your own values:

```bash
cp .env.example .env
```

```env
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your16charapppassword
PORT=5000
```

⚠️ Important: Use a Gmail App Password, not your normal Gmail password.
👉 [How to generate a Gmail App Password](https://support.google.com/mail/answer/185833?hl=en)

### 4. Run the server

For development (with auto-reload using nodemon):

```bash
npm run dev
```

For production:

```bash
npm start
```

---

## 📡 API Endpoints

### POST /send-email

Send a contact form submission.

**Request body (JSON):**

```json
{
  "from_name": "Emmanuel Uzor",
  "from_email": "emma2203@example.com",
  "message": "Hello, I am interested in your services!"
}
```

**Response (success, 200):**

```json
{
  "success": true,
  "message": "Email sent successfully!"
}
```

**Response (validation error, 400):**

```json
{
  "error": "Please provide a valid email address."
}
```

**Response (rate limited, 429):**

```json
{
  "error": "Too many messages sent. Please try again later."
}
```

**Response (server error, 500):**

```json
{
  "error": "Failed to send email",
  "details": "Error message trace detailed from SMTP server"
}
```

---

## 🔒 Security Notes

- `POST /send-email` is rate limited to 5 requests per IP every 15 minutes to
  prevent spam and protect the Gmail account from being flagged.
- Request fields are strictly validated server-side, independent of the frontend's
  own validation, since this endpoint can be called directly by tools like Postman or curl.
- Production Variable Injection: On deployment platforms (such as Railway or Render),
  never force-push or upload a .env file. Instead, manually bind EMAIL_USER and EMAIL_PASS
  in the cloud platform's Variables/Environment dashboard.
- Production Failure Diagnostics: If emails fail to deploy properly in production,
  check your host cloud console interface under the Deploy Logs terminal log output rather than
  the raw HTTP status monitor to inspect the exact trace tagged by the phrase: ❌ NODEMAILER FAILURE DETAILS:.

---

## 📜 License

MIT License © 2026 Emmanuel Chidiebube Uzor.
