import jwt from "jsonwebtoken";

/**
 * Protects write routes (PUT /api/posts, /api/projects, /api/videos).
 * Expects: Authorization: Bearer <token>
 * The token is the same JWT issued by POST /api/auth/login and already
 * stored by the frontend in sessionStorage (see AdminStore.jsx).
 */
export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Missing or malformed Authorization header" });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
