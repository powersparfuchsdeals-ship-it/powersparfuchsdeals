import { runAutoSync } from "../../../lib/runAutoSync";
import { requireAdminApi } from "../../../lib/requireAdminApi";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const adminUser = await requireAdminApi(req, res);
  if (!adminUser) return;

  try {
    const result = await runAutoSync();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error"
    });
  }
}
