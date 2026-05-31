/** Join codes are 8 uppercase alphanumeric characters. */
export const JOIN_CODE_RE = /^[A-Z0-9]{8}$/;

export function normalizeJoinCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function isValidJoinCode(code: string): boolean {
  return JOIN_CODE_RE.test(code.trim());
}
