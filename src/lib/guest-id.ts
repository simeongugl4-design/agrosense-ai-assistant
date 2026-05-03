// Shared guest identifier (offline-friendly, persisted in localStorage).
// Used wherever Lovable Cloud RLS allows public writes but we still want a stable per-device author.
const STORAGE_KEY = "agrosense_guest_id";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function getGuestId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id || !UUID_RE.test(id)) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

const NAME_KEY = "agrosense_guest_name";
export function getGuestName(): string {
  return localStorage.getItem(NAME_KEY) || "Anonymous Farmer";
}
export function setGuestName(name: string): void {
  localStorage.setItem(NAME_KEY, name.trim() || "Anonymous Farmer");
}
