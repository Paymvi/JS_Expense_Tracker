// Unique id for new records. Older Android WebViews may lack
// crypto.randomUUID, so fall back to time + random hex.
export function createId() {

  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;

}
