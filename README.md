# 📩 Portfolio Backend – Contact Form & Admin Auth API

This is the **backend server** for my portfolio website.
It handles contact form submissions and secure admin authentication using **Node.js, Express, Resend, and JWT**.

---

## 🚀 Features

- REST API built with **Express.js**
- Handles **contact form submissions** from the frontend
- Uses **Resend API** for email delivery
- **JWT-based admin authentication** — password never exposed in the frontend bundle
- **Security headers** via Helmet
- **CORS locked** to specific allowed frontend origins only
- **Rate limited** — max 5 contact submissions and 10 auth attempts per IP per 15 minutes
- **Server-side validation** on data types, email regex patterns, and string length restrictions
- **Automated reply handling** via `replyTo` headers, routing replies to the visitor not yourself
- Secrets safely stored in `.env` locally and configured via cloud variables in production (never committed to GitHub)
- Explicit startup environment validation to immediately identify missing variables
- **ESLint configured** for code quality checks

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- Resend API
- JSON Web Tokens (`jsonwebtoken`)
- Helmet
- dotenv
- CORS
- express-rate-limit
- ESLint

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

### 3. Create a `.env` file in the project root

```env
RESEND_API_KEY=your_resend_api_key
EMAIL_USER=youremail@gmail.com
ADMIN_PASSWORD=your_secure_admin_password
JWT_SECRET=your_long_random_secret_string
PORT=5000
```

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

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

### POST `/api/auth/login`

Authenticates the admin and returns a signed JWT token. The password is validated entirely on the server — it is never stored or exposed in the frontend bundle.

**Request body (JSON):**

```json
{
  "password": "your_admin_password"
}
```

**Response (success, 200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (invalid password, 401):**

```json
{
  "error": "Invalid password"
}
```

**Response (rate limited, 429):**

```json
{
  "error": "Too many login attempts. Try again later."
}
```

**Response (server misconfigured, 500):**

```json
{
  "error": "Server misconfigured"
}
```

---

### POST `/api/auth/verify`

Verifies whether a JWT token is still valid and unexpired.

**Request body (JSON):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (valid, 200):**

```json
{
  "valid": true
}
```

**Response (invalid or expired, 401):**

```json
{
  "valid": false
}
```

---

### POST `/send-email`

Sends a contact form submission to the portfolio owner's inbox via Resend.

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
  "error": "Failed to send email"
}
```

---

## 🔒 Security Notes

- **Admin password never reaches the frontend.** Authentication is handled entirely server-side via `/api/auth/login`. The JWT token returned is stored in `sessionStorage` and expires after 8 hours.

- **JWT tokens are signed** with `JWT_SECRET` using HS256. Tampering with the token payload invalidates the signature.

- **CORS is locked** to specific allowed origins only — the local dev URL and the deployed frontend URL. Requests from any other origin are rejected.

- **Security headers** are applied via Helmet on every response, including `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and others.

- **Rate limiting** protects both routes:
  - `/api/auth` — max 10 login attempts per IP per 15 minutes
  - `/send-email` — max 5 submissions per IP per 15 minutes

- **Production Variable Injection:** On Railway or any other deployment platform, never upload a `.env` file. Instead, manually bind all environment variables (`RESEND_API_KEY`, `EMAIL_USER`, `ADMIN_PASSWORD`, `JWT_SECRET`) via the platform's Variables/Environment dashboard.

- **Production Failure Diagnostics:** If the server fails to start in production, check the Deploy Logs in your Railway dashboard for the exact error trace from the startup environment validation check.

---

## 🧪 Code Quality

ESLint is configured for this project. Run a check with:

```bash
npx eslint .
```

---

## 📜 License

MIT License © 2026 Emmanuel Chidiebube Uzor.
