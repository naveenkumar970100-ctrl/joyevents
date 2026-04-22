import { API_URL } from "./config";

const CACHE_KEY_PREFIX = "gt_cache_";

// Load cache from localStorage for persistence across page loads
function loadCache(lang: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + lang);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(lang: string, cache: Record<string, string>) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + lang, JSON.stringify(cache));
  } catch {
    // localStorage full — clear old caches
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_KEY_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
}

// In-memory cache (fast lookup, loaded from localStorage)
const memCache: Record<string, Record<string, string>> = {};

function getCache(lang: string): Record<string, string> {
  if (!memCache[lang]) memCache[lang] = loadCache(lang);
  return memCache[lang];
}

// Pending requests deduplication
const pendingRequests: Record<string, Promise<string[]>> = {};

export async function translateTexts(texts: string[], targetLang: string): Promise<string[]> {
  if (targetLang === "en") return texts;

  const cache = getCache(targetLang);
  const result: string[] = new Array(texts.length);
  const uncachedTexts: string[] = [];
  const uncachedIndices: number[] = [];

  // Split cached vs uncached
  texts.forEach((text, i) => {
    if (!text?.trim() || text.length < 2) {
      result[i] = text;
    } else if (cache[text]) {
      result[i] = cache[text];
    } else {
      uncachedTexts.push(text);
      uncachedIndices.push(i);
    }
  });

  if (uncachedTexts.length === 0) return result;

  // Deduplicate: group identical texts
  const uniqueTexts = [...new Set(uncachedTexts)];

  // Batch into chunks of 100 for speed
  const CHUNK_SIZE = 100;
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueTexts.length; i += CHUNK_SIZE) {
    chunks.push(uniqueTexts.slice(i, i + CHUNK_SIZE));
  }

  // Translate all chunks in parallel
  const allTranslated: string[] = [];
  await Promise.all(
    chunks.map(async (chunk) => {
      const cacheKey = `${targetLang}:${chunk.join("|")}`;
      let promise = pendingRequests[cacheKey];
      if (!promise) {
        promise = fetch(`${API_URL}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: chunk, target: targetLang }),
        })
          .then(r => r.ok ? r.json() : { translations: chunk })
          .then(d => d.translations as string[])
          .catch(() => chunk)
          .finally(() => { delete pendingRequests[cacheKey]; });
        pendingRequests[cacheKey] = promise;
      }
      const translated = await promise;
      chunk.forEach((text, i) => {
        cache[text] = translated[i] || text;
      });
      allTranslated.push(...translated);
    })
  );

  // Persist updated cache
  saveCache(targetLang, cache);

  // Fill result array
  uncachedIndices.forEach((origIdx, i) => {
    result[origIdx] = cache[uncachedTexts[i]] || uncachedTexts[i];
  });

  return result;
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  const results = await translateTexts([text], targetLang);
  return results[0];
}
