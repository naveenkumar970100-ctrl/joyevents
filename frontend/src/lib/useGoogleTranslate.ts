import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { translateTexts } from "./googleTranslate";

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "CODE", "PRE",
  "INPUT", "TEXTAREA", "SELECT", "OPTION", "SVG", "PATH",
]);

// Global store of original English text nodes
const originalTexts = new WeakMap<Text, string>();
// Track which lang each node is currently showing
const nodeCurrentLang = new WeakMap<Text, string>();

function getTextNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node as Text;
    const parent = text.parentElement;
    if (!parent) continue;
    if (SKIP_TAGS.has(parent.tagName)) continue;
    if (parent.closest(".notranslate, [data-notranslate]")) continue;
    const content = text.textContent?.trim();
    if (!content || content.length < 2) continue;
    // Skip pure numbers/symbols
    if (/^[\d\s₹$€£%.,+\-*/=<>()[\]{}|@#^&!?:;'"]+$/.test(content)) continue;
    nodes.push(text);
  }
  return nodes;
}

// Apply cached translations instantly (synchronous)
function applyFromCache(nodes: Text[], lang: string, cache: Record<string, string>) {
  nodes.forEach(node => {
    const orig = originalTexts.get(node) ?? node.textContent ?? "";
    if (!originalTexts.has(node)) originalTexts.set(node, orig);
    const translated = cache[orig];
    if (translated && translated !== orig) {
      node.textContent = translated;
      nodeCurrentLang.set(node, lang);
    }
  });
}

// Restore all nodes to English
function restoreOriginals(nodes: Text[]) {
  nodes.forEach(node => {
    const orig = originalTexts.get(node);
    if (orig !== undefined) {
      node.textContent = orig;
      nodeCurrentLang.set(node, "en");
    }
  });
}

export function useGoogleTranslate() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const activeRef = useRef(false);
  const currentLangRef = useRef("en");

  const translatePage = useCallback(async (targetLang: string) => {
    // Prevent concurrent runs
    if (activeRef.current && currentLangRef.current === targetLang) return;
    activeRef.current = true;
    currentLangRef.current = targetLang;

    const root = document.getElementById("root") || document.body;
    const nodes = getTextNodes(root);

    // Step 1: Restore to English first
    restoreOriginals(nodes);

    if (targetLang === "en") {
      activeRef.current = false;
      return;
    }

    // Step 2: Apply cached translations INSTANTLY (no network wait)
    const cacheKey = "gt_cache_" + targetLang;
    let cache: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) cache = JSON.parse(raw);
    } catch {}

    if (Object.keys(cache).length > 0) {
      applyFromCache(nodes, targetLang, cache);
    }

    // Step 3: Find nodes not yet translated (not in cache)
    const originals = nodes.map(n => originalTexts.get(n) ?? n.textContent ?? "");
    const uncachedTexts = [...new Set(originals.filter(t => t.trim().length >= 2 && !cache[t]))];

    if (uncachedTexts.length > 0) {
      try {
        const translated = await translateTexts(uncachedTexts, targetLang);
        // Build updated cache
        uncachedTexts.forEach((text, i) => { cache[text] = translated[i] || text; });

        // Only update if still on same language
        if (currentLangRef.current === targetLang) {
          nodes.forEach((node, i) => {
            const orig = originals[i];
            const tr = cache[orig];
            if (tr && tr !== orig) node.textContent = tr;
          });
        }
      } catch {
        // Network error — keep cached translations
      }
    }

    activeRef.current = false;
  }, []);

  useEffect(() => {
    translatePage(lang);
  }, [lang, translatePage]);

  // Also re-translate when DOM changes (for dynamic content)
  useEffect(() => {
    if (lang === "en") return;

    const observer = new MutationObserver(() => {
      if (!activeRef.current) {
        translatePage(lang);
      }
    });

    observer.observe(document.getElementById("root") || document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [lang, translatePage]);
}
