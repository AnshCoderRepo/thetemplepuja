// Legacy standalone script kept for compatibility — safe no-op if pixel already initialized
(function () {
  if (typeof window !== "undefined" && window.fbq && window.fbq.loaded) {
    return;
  }
})();