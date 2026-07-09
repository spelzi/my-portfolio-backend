# 📩 Portfolio Backend – Contact Form & Admin Auth API

This is the **backend server** for my portfolio website.
It handles contact form submissions and secure admin authentication using **Node.js, Express, Resend, and JWT**.

---

## 🚀 Features

- REST API built with **Express.js**
- Handles **contact form submissions** from the frontend
- Uses **Resend API** for email delivery
- **JWT-based admin authentication** — password never exposed in the frontend bundle
- **Content storage** for blog posts, projects, and videos — backed by **Supabase (PostgreSQL)**, so admin edits are visible to every visitor, not just the device that made them
- **Security headers** via Helmet
- **CORS locked** to specific allowed frontend origins only
- **Rate limited** — max 5 contact submissions, 10 auth attempts, and 30 content updates per collection, per IP, per 15 minutes
- **Server-side validation** on data types, email regex patterns, string length restrictions, and content shape
- **Automated reply handling** via `replyTo` headers, routing replies to the visitor not yourself
- Secrets safely stored in `.env` locally and configured via cloud variables in production (never committed to GitHub)
- Explicit startup environment validation to immediately identify missing variables
- **ESLint configured** for code quality checks

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- Supabase (PostgreSQL) — posts, projects, videos storage
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
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=5000
```

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In your project, go to **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it. This creates the `posts`, `projects`, and `videos` tables with Row Level Security enabled and no public policies — only this backend's `service_role` key can read or write them.
3. In **Project Settings → API**, copy the **Project URL** into `SUPABASE_URL` and the **service_role** key (not the `anon` key) into `SUPABASE_SERVICE_ROLE_KEY` in your `.env`.
4. Populate the tables with the site's current default content:

   ```bash
   npm run seed
   ```

   This is safe to run once after setup. Don't re-run it after you've started adding real content through the admin panel — it will overwrite whatever is currently stored.

### 5. Run the server

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

### Content endpoints — Posts, Projects, Videos

Three collections share the same pattern, at `/api/posts`, `/api/projects`, and `/api/videos`:

- **`GET /api/posts`** (and `/api/projects`, `/api/videos`) — public, no auth required. Returns the full collection as a JSON array, ordered the same way it was last saved.
- **`PUT /api/posts`** (and `/api/projects`, `/api/videos`) — admin-only. **Replaces the entire collection** with the array in the request body — this is not a per-item PATCH, the whole array is the new source of truth. Requires `Authorization: Bearer <token>` with a valid JWT from `/api/auth/login`.

This "replace the whole collection" design matches how the frontend's admin panel already worked when it saved to `localStorage` — it always computed the complete updated array (after an add/edit/delete) and saved that. Swapping the storage layer to Supabase required zero changes to that logic.

**GET example response** (`/api/posts`):

```json
[
  {
    "slug": "understanding-smart-money-concepts-forex",
    "title": "Understanding Smart Money Concepts in Forex",
    "category": "Trading",
    "date": "Mar 2025",
    "readTime": "8 min read",
    "excerpt": "A deep dive into how institutional traders move markets...",
    "content": [{ "type": "p", "text": "..." }]
  }
]
```

**PUT request body** — the same shape as the GET response, as a full array:

```json
[
  {
    "slug": "my-new-post",
    "title": "My New Post",
    "category": "Trading",
    "date": "Jul 2026",
    "readTime": "5 min read",
    "excerpt": "A short summary.",
    "content": [{ "type": "p", "text": "Post body." }]
  }
]
```

**Response (success, 200):**

```json
{ "success": true, "count": 1 }
```

**Response (validation error, 400):**

```json
{ "error": "Item 0: slug is required" }
```

**Response (missing/invalid auth, 401):**

```json
{ "error": "Missing or malformed Authorization header" }
```

**Response (rate limited, 429):**

```json
{ "error": "Too many updates. Try again later." }
```

`projects` items use: `id`, `title`, `category`, `stack` (array or comma-separated string, normalized to an array), `desc`, `status`, `link`, `link1`.

`videos` items use: `id`, `youtubeId`, `title`, `category`, `description`, `date`.

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
  "error": "Failed to send email."
}
```

---

## 🔒 Security Notes

- **Admin password never reaches the frontend.** Authentication is handled entirely server-side via `/api/auth/login`. The JWT token returned is stored in `sessionStorage` and expires after 8 hours.

- **JWT tokens are signed** with `JWT_SECRET` using HS256. Tampering with the token payload invalidates the signature.

- **CORS is locked** to specific allowed origins only — the local dev URL and the deployed frontend URL. Requests from any other origin are rejected.

- **Security headers** are applied via Helmet on every response, including `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and others.

- **Rate limiting** protects every write route:
  - `/api/auth` — max 10 login attempts per IP per 15 minutes
  - `/send-email` — max 5 submissions per IP per 15 minutes
  - `PUT /api/posts`, `/api/projects`, `/api/videos` — max 30 updates per IP per 15 minutes, each

- **Supabase access is server-only.** The `service_role` key bypasses Row Level Security and is never sent to the frontend — it lives only in this backend's environment variables. Every table has RLS enabled with no public policies, so even a leaked `anon` key could not read or write these tables directly; this Express server is the only path in.

- **Production Variable Injection:** On Railway or any other deployment platform, never upload a `.env` file. Instead, manually bind all environment variables (`RESEND_API_KEY`, `EMAIL_USER`, `ADMIN_PASSWORD`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) via the platform's Variables/Environment dashboard.

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
