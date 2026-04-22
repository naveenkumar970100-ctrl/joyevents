// Session management — ensures new tabs always require re-login.
//
// Problem: Chrome copies sessionStorage to new tabs opened from the same origin.
// Solution: On every page load, check if this is a "fresh" navigation (new tab /
// pasted URL) using the Navigation Timing API. If it is, clear sessionStorage so
// the user must log in again.
//
// navigation.type values:
//   "navigate"  — fresh load (new tab, pasted URL, typed URL)
//   "reload"    — F5 / Ctrl+R (same tab refresh — keep session)
//   "back_forward" — browser back/forward (keep session)
//   "prerender" — prerendered page

export function initSession() {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const navType = nav?.type ?? "navigate";

  if (navType === "navigate") {
    sessionStorage.removeItem("sessionActive");
  }
}

export function setSessionActive() {
  sessionStorage.setItem("sessionActive", "1");
}

export function clearSession() {
  sessionStorage.removeItem("sessionActive");
}

export function isSessionActive(): boolean {
  return sessionStorage.getItem("sessionActive") === "1";
}
