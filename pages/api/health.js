import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const { error } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, time: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Health check failed" });
  }
}
