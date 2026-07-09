import { makeCollectionRouter } from "../lib/collectionRouter.js";

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

function validateVideo(video) {
  if (typeof video !== "object" || video === null) return "must be an object";
  if (!isNonEmptyString(video.id)) return "id is required";
  if (!isNonEmptyString(video.title)) return "title is required";
  return null;
}

function mapFromDb(row) {
  return {
    id: row.id,
    youtubeId: row.youtube_id || "",
    title: row.title,
    category: row.category || "",
    description: row.description || "",
    date: row.date || "",
  };
}

function mapToDb(video, index) {
  return {
    id: video.id.trim(),
    youtube_id: video.youtubeId || "",
    title: video.title.trim(),
    category: video.category || "",
    description: video.description || "",
    date: video.date || "",
    sort_order: index,
  };
}

export default makeCollectionRouter({
  table: "videos",
  mapFromDb,
  mapToDb,
  validateItem: validateVideo,
});
