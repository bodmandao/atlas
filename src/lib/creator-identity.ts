const HANDLE_KEY = "atlas.creatorHandle";
const NAME_KEY = "atlas.creatorName";

// No wallet auth this slice — a lightweight, locally-persisted handle is
// enough to attribute published theses to a creator. Sybil resistance isn't
// a real threat yet at near-zero users; wallet-verified identity is a
// deliberate later phase, not a gap in this one.
export function getOrCreateCreatorHandle(): string {
  if (typeof window === "undefined") return "server";
  let handle = window.localStorage.getItem(HANDLE_KEY);
  if (!handle) {
    handle = crypto.randomUUID().slice(0, 8);
    window.localStorage.setItem(HANDLE_KEY, handle);
  }
  return handle;
}

export function getCreatorName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(NAME_KEY);
}

export function setCreatorName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name.trim());
}
