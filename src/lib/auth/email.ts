/** Map a Jägername to the internal Supabase Auth email address. */
export function toAuthEmail(username: string): string {
  const slug = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  return `${slug}@mhwbg.local`;
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (trimmed.length < 2) return "Mindestens 2 Zeichen.";
  if (trimmed.length > 24) return "Maximal 24 Zeichen.";
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return "Nur Buchstaben, Zahlen, _ und -.";
  }
  return null;
}
