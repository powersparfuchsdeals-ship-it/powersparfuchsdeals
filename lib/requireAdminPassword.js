import { createHash, timingSafeEqual } from "node:crypto";

// Server-only: never import this module into a React component.
export function requireAdminPassword(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const expected = process.env.ADMIN_PASSWORD;
  const supplied = req.headers["x-admin-password"];
  if (typeof expected !== "string" || !expected.trim()) {
    res.status(503).json({ ok: false, error: "Admin-Anmeldung ist noch nicht eingerichtet." });
    return false;
  }
  if (typeof supplied !== "string" || !supplied || supplied.length > 1024) {
    res.status(401).json({ ok: false, error: "Anmeldung erforderlich." });
    return false;
  }
  const digest = (value) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(expected), digest(supplied))) {
    res.status(401).json({ ok: false, error: "Passwort falsch oder nicht mehr gültig." });
    return false;
  }
  return true;
}
