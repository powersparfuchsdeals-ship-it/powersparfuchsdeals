import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { requireAdminApi } from "../../../lib/requireAdminApi";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const adminUser = await requireAdminApi(req, res);
  if (!adminUser) return;

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
