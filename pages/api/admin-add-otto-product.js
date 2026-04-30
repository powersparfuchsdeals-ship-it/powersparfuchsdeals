export default function handler(req, res) {
  return res.status(503).json({
    ok: false,
    error: "OTTO Import deaktiviert",
  });
}
