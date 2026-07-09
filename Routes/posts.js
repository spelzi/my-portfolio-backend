import { makeCollectionRouter } from "../lib/collectionRouter.js";

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

function validatePost(post) {
  if (typeof post !== "object" || post === null) return "must be an object";
  if (!isNonEmptyString(post.slug)) return "slug is required";
  if (!isNonEmptyString(post.title)) return "title is required";
  if (!isNonEmptyString(post.category)) return "category is required";
  if (!isNonEmptyString(post.date)) return "date is required";
  if (!isNonEmptyString(post.readTime)) return "readTime is required";
  if (typeof post.excerpt !== "string") return "excerpt must be a string";
  if (!Array.isArray(post.content)) return "content must be an array";
  return null;
}

function mapFromDb(row) {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    date: row.date,
    readTime: row.read_time,
    excerpt: row.excerpt,
    content: row.content,
  };
}

function mapToDb(post, index) {
  return {
    slug: post.slug.trim(),
    title: post.title.trim(),
    category: post.category.trim(),
    date: post.date.trim(),
    read_time: post.readTime.trim(),
    excerpt: post.excerpt,
    content: post.content,
    sort_order: index,
  };
}

export default makeCollectionRouter({
  table: "posts",
  mapFromDb,
  mapToDb,
  validateItem: validatePost,
});
