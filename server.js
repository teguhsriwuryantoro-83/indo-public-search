const express = require("express");
const helmet = require("helmet");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const cache = new Map();
const CACHE_TTL = 3 * 60 * 1000;
const MAX_CACHE = 150;

function jsonError(res, status, message) {
  return res.status(status).json({ error: message });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, apiConfigured: Boolean(API_KEY), service: "maztege-youtube-archive-search" });
});

app.get("/api/search", async (req, res) => {
  if (!API_KEY) return jsonError(res, 503, "Server belum dikonfigurasi dengan YOUTUBE_API_KEY.");
  const q = String(req.query.q || "").trim().slice(0, 120);
  const year = Number(req.query.year);
  const month = req.query.month ? Number(req.query.month) : null;
  const order = ["relevance", "date", "viewCount", "rating"].includes(req.query.order) ? req.query.order : "relevance";
  const maxResults = Math.min(50, Math.max(1, Number(req.query.maxResults) || 25));
  const pageToken = String(req.query.pageToken || "").slice(0, 500);
  if (q.length < 2) return jsonError(res, 400, "Kata kunci minimal 2 karakter.");
  const currentYear = new Date().getUTCFullYear();
  if (!Number.isInteger(year) || year < 2005 || year > currentYear) return jsonError(res, 400, "Tahun upload tidak valid.");
  if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) return jsonError(res, 400, "Bulan tidak valid.");

  const after = month ? new Date(Date.UTC(year, month - 1, 1)) : new Date(Date.UTC(year, 0, 1));
  const before = month ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year + 1, 0, 1));
  const params = new URLSearchParams({
    key: API_KEY, part: "snippet", type: "video", q,
    publishedAfter: after.toISOString(), publishedBefore: before.toISOString(),
    maxResults: String(maxResults), order, regionCode: "ID", safeSearch: "none"
  });
  if (pageToken) params.set("pageToken", pageToken);
  const cacheKey = params.toString().replace(API_KEY, "KEY");
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) return res.json({ ...cached.data, cached: true });

  try {
    const searchUrl = "https://www.googleapis.com/youtube/v3/search?" + params.toString();
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    if (!searchResponse.ok) {
      const reason = searchData?.error?.errors?.[0]?.reason;
      if (reason === "quotaExceeded") return jsonError(res, 429, "Kuota YouTube API hari ini habis. Coba lagi setelah kuota reset.");
      return jsonError(res, searchResponse.status, searchData?.error?.message || "YouTube API gagal memproses pencarian.");
    }
    const ids = (searchData.items || []).map(item => item.id?.videoId).filter(Boolean);
    let details = {};
    if (ids.length) {
      const detailParams = new URLSearchParams({ key: API_KEY, part: "contentDetails,statistics", id: ids.join(",") });
      const detailResponse = await fetch("https://www.googleapis.com/youtube/v3/videos?" + detailParams.toString());
      const detailData = await detailResponse.json();
      if (detailResponse.ok) details = Object.fromEntries((detailData.items || []).map(v => [v.id, v]));
    }
    const items = (searchData.items || []).map(item => {
      const id = item.id?.videoId;
      const detail = details[id] || {};
      return {
        id, url: "https://www.youtube.com/watch?v=" + id,
        title: item.snippet?.title || "", description: item.snippet?.description || "",
        publishedAt: item.snippet?.publishedAt || null,
        channelTitle: item.snippet?.channelTitle || "",
        channelId: item.snippet?.channelId || "",
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
        viewCount: detail.statistics?.viewCount || null,
        duration: detail.contentDetails?.duration || null
      };
    });
    const result = {
      items, nextPageToken: searchData.nextPageToken || null,
      totalResults: searchData.pageInfo?.totalResults || 0,
      query: q, year, month, order,
      range: { after: after.toISOString(), before: before.toISOString() },
      cached: false
    };
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
    cache.set(cacheKey, { at: Date.now(), data: result });
    res.set("Cache-Control", "private, max-age=30");
    return res.json(result);
  } catch (error) {
    return jsonError(res, 502, "Tidak dapat menghubungi YouTube saat ini: " + error.message);
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log("MAZTEGE YouTube Archive Search listening on " + PORT));
