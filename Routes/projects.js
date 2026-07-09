import { makeCollectionRouter } from "../lib/collectionRouter.js";

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

// The frontend's admin form sends stack as a comma-separated string
// ("React, Vite, Supabase"); PastWork.jsx already normalizes either an
// array or a string when rendering. We store it as a real Postgres array,
// accepting either shape from the client.
function normalizeStack(stack) {
  if (Array.isArray(stack)) {
    return stack.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof stack === "string") {
    return stack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function validateProject(project) {
  if (typeof project !== "object" || project === null)
    return "must be an object";
  if (!isNonEmptyString(project.id)) return "id is required";
  if (!isNonEmptyString(project.title)) return "title is required";
  return null;
}

function mapFromDb(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category || "",
    stack: row.stack || [],
    desc: row.description || "",
    status: row.status || "",
    link: row.link || "",
    link1: row.link1 || "",
  };
}

function mapToDb(project, index) {
  return {
    id: project.id.trim(),
    title: project.title.trim(),
    category: project.category || "",
    stack: normalizeStack(project.stack),
    description: project.desc || "",
    status: project.status || "",
    link: project.link || "",
    link1: project.link1 || "",
    sort_order: index,
  };
}

export default makeCollectionRouter({
  table: "projects",
  mapFromDb,
  mapToDb,
  validateItem: validateProject,
});
