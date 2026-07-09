/**
 * scripts/seed.js
 *
 * Populates the posts, projects, and videos tables with the site's current
 * default content — the same data that's hardcoded in the frontend's
 * postsData.js / videosData.js / AdminPastWork.jsx. Run this ONCE after
 * creating the schema (supabase/schema.sql) so the live site shows the same
 * content on day one that it showed when everything lived in localStorage.
 *
 * Safe to re-run: it deletes and re-inserts each table's rows, so running
 * it twice just re-seeds the same data (it will NOT duplicate rows, but it
 * WILL overwrite any real edits you've made via the admin panel since the
 * last seed — don't run this again after you've started using the live
 * admin panel for real content).
 *
 * Usage:
 *   npm run seed
 */

import "dotenv/config";
import { supabase } from "../lib/supabaseClient.js";
import { posts } from "./_postsSeed.js";
import { projects } from "./_projectsSeed.js";
import { defaultVideos as videos } from "./_videosSeed.js";

async function seedPosts() {
  const rows = posts.map((p, index) => ({
    slug: p.slug,
    title: p.title,
    category: p.category,
    date: p.date,
    read_time: p.readTime,
    excerpt: p.excerpt,
    content: p.content,
    sort_order: index,
  }));

  await supabase.from("posts").delete().gte("row_id", 0);
  const { error } = await supabase.from("posts").insert(rows);
  if (error) throw new Error(`posts seed failed: ${error.message}`);
  console.log(`  ✓  posts        (${rows.length} rows)`);
}

async function seedProjects() {
  const rows = projects.map((p, index) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    stack: p.stack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    description: p.desc,
    status: p.status,
    link: p.link,
    link1: p.link1,
    sort_order: index,
  }));

  await supabase.from("projects").delete().gte("row_id", 0);
  const { error } = await supabase.from("projects").insert(rows);
  if (error) throw new Error(`projects seed failed: ${error.message}`);
  console.log(`  ✓  projects     (${rows.length} rows)`);
}

async function seedVideos() {
  const rows = videos.map((v, index) => ({
    id: v.id,
    youtube_id: v.youtubeId,
    title: v.title,
    category: v.category,
    description: v.description,
    date: v.date,
    sort_order: index,
  }));

  await supabase.from("videos").delete().gte("row_id", 0);
  const { error } = await supabase.from("videos").insert(rows);
  if (error) throw new Error(`videos seed failed: ${error.message}`);
  console.log(`  ✓  videos       (${rows.length} rows)`);
}

console.log("Seeding Supabase with default site content...\n");

try {
  await seedPosts();
  await seedProjects();
  await seedVideos();
  console.log(
    "\nDone. Your Supabase tables now match the site's current content.",
  );
} catch (err) {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
}
