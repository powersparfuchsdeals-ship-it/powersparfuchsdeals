import { runAutoSync } from "../../../lib/runAutoSync";

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const expectedSecret = process.env.CRON_SECRET;
  const token = getBearerToken(req);
  const isCron = req.headers["x-vercel-cron"] === "1";

  if (!isCron && (!expectedSecret || token !== expectedSecret)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const result = await runAutoSync();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
