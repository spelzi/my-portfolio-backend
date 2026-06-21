# 📩 Portfolio Backend – Contact Form API

This is the **backend server** for my portfolio website.
It handles sending contact form messages securely using **Node.js, Express, and Nodemailer**.

---

## 🚀 Features

- REST API built with **Express.js**
- Handles **contact form submissions** from the frontend
- Uses **Nodemailer** to send emails
- Secrets stored in `.env` file (not committed to GitHub)
- CORS enabled to allow frontend requests
- **Rate limited** — max 5 submissions per IP per 15 minutes
- **Server-side validation** on name, email, and message fields

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- Nodemailer
- dotenv
- CORS
- express-rate-limit

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/my-portfolio-backend.git
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
  "from_name": "John Doe",
  "from_email": "johndoe@example.com",
  "message": "Hello, I am interested in your services!"
}
```

**Response (success):**

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
  "error": "Failed to send email"
}
```

---

## 🔒 Security Notes

- `POST /send-email` is rate limited to 5 requests per IP every 15 minutes to
  prevent spam and protect the Gmail account from being flagged.
- Request fields are validated server-side, independent of the frontend's
  own validation, since this endpoint can be called directly.
- On deployment (e.g. Render, Railway, Vercel), set environment variables in
  the platform's dashboard rather than uploading a `.env` file.

---

## 📜 License

MIT License © 2026 Emmanuel Chidiebube Uzor
