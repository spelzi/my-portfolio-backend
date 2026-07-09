import express from "express";
import { rateLimit } from "express-rate-limit";
import { supabase } from "./supabaseClient.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

/**
 * Builds a router exposing:
 *   GET /   — public, returns the full collection ordered by sort_order
 *   PUT /   — admin-only, REPLACES the entire collection with the given array
 *
 * Why "replace whole collection" instead of per-item REST (POST/PATCH/DELETE
 * per row)? Because that's exactly how the frontend's AdminStore already
 * worked with localStorage — AdminStore.savePosts(fullArray) always wrote
 * the complete array after any add/edit/delete, never a single row. Keeping
 * that contract means the admin components (AdminBlog.jsx, AdminPastWork.jsx,
 * AdminVideos.jsx) need zero changes to their save logic — only AdminStore's
 * storage mechanism swaps from localStorage to a fetch() call.
 *
 * @param {string} table - Supabase table name
 * @param {(row: object) => object} mapFromDb - DB row -> frontend shape
 * @param {(item: object, index: number) => object} mapToDb - frontend item -> DB row (assigns sort_order)
 * @param {(item: object) => string|null} validateItem - returns an error string, or null if valid
 * @param {number} [maxItems] - safety cap on array length accepted per write
 */
export function makeCollectionRouter({
  table,
  mapFromDb,
  mapToDb,
  validateItem,
  maxItems = 500,
}) {
  const router = express.Router();

  // Generous limit for legitimate admin use, still bounds abuse if a token
  // ever leaked. Each collection gets its own independent budget.
  const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many updates. Try again later." },
  });

  router.get("/", async (req, res) => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(`[${table}] GET failed:`, error.message);
      return res.status(500).json({ error: `Failed to load ${table}` });
    }

    res.json(data.map(mapFromDb));
  });

  router.put("/", writeLimiter, requireAdmin, async (req, res) => {
    const items = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Request body must be an array" });
    }
    if (items.length > maxItems) {
      return res
        .status(400)
        .json({ error: `Too many items (max ${maxItems})` });
    }

    for (const [index, item] of items.entries()) {
      const validationError = validateItem(item);
      if (validationError) {
        return res
          .status(400)
          .json({ error: `Item ${index}: ${validationError}` });
      }
    }

    const rows = items.map((item, index) => mapToDb(item, index));

    // NOTE: this is a sequential delete-then-insert, not a single atomic
    // transaction — the Supabase JS client doesn't expose transactions over
    // its REST interface. For a single-admin, low-traffic portfolio this is
    // an acceptable, deliberate tradeoff: there's a brief window mid-write
    // where the table is empty. If this ever needs to be airtight (e.g.
    // multiple concurrent admins), move it into a Postgres function called
    // via supabase.rpc(), which Supabase does run as a real transaction.
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .gte("row_id", 0);

    if (deleteError) {
      console.error(`[${table}] delete failed:`, deleteError.message);
      return res.status(500).json({ error: `Failed to update ${table}` });
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from(table).insert(rows);
      if (insertError) {
        console.error(`[${table}] insert failed:`, insertError.message);
        return res.status(500).json({ error: `Failed to update ${table}` });
      }
    }

    res.json({ success: true, count: rows.length });
  });

  return router;
}
