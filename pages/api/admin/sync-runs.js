// pages/api/admin/sync-runs.js
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const accessToken = getBearerToken(req);
  if (!accessToken) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !userData?.user) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const { data, error } = await supabaseAdmin
    .from("sync_runs")
    .select("id, run_key, source_name, item_count, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({
    ok: true,
    runs: data || []
  });
}
