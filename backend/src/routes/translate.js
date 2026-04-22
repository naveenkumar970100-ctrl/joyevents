import { Router } from "express";
import translate from "google-translate-api-x";

const router = Router();

// Persistent in-memory cache: "text|lang" -> translated
const cache = new Map();
const MAX_CACHE = 10000;

async function translateOne(text, target) {
  const key = `${text}|${target}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const result = await translate(text, { to: target, forceBatch: false });
    const translated = result?.text || text;
    if (cache.size >= MAX_CACHE) {
      // Evict oldest 20%
      const keys = [...cache.keys()].slice(0, MAX_CACHE * 0.2);
      keys.forEach(k => cache.delete(k));
    }
    cache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
}

// POST /api/translate
router.post("/", async (req, res) => {
  try {
    const { texts, target } = req.body;

    if (!Array.isArray(texts) || !target) {
      return res.status(400).json({ error: "texts[] and target required" });
    }

    if (target === "en") {
      return res.json({ translations: texts });
    }

    // Deduplicate to avoid redundant API calls
    const unique = [...new Set(texts.filter(t => t && typeof t === "string"))];

    // Translate unique texts in parallel (max 10 concurrent)
    const CONCURRENCY = 10;
    const results = {};

    for (let i = 0; i < unique.length; i += CONCURRENCY) {
      const batch = unique.slice(i, i + CONCURRENCY);
      const translated = await Promise.all(batch.map(t => translateOne(t, target)));
      batch.forEach((text, idx) => { results[text] = translated[idx]; });
    }

    const translations = texts.map(t => results[t] || t);
    res.json({ translations });
  } catch (e) {
    res.status(500).json({ error: e.message || "Translation failed" });
  }
});

export default router;
