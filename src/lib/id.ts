/**
 * Client/server-safe id for refresh tokens.
 * Never use crypto.randomUUID — on some iOS Safari / WebView contexts it throws
 * DOMException: "The string did not match the expected pattern."
 */
export function createRequestId(): string {
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}
