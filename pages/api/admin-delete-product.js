import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_PASSWORD = "test1405";

export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Nur POST erlaubt",
    });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "ID fehlt",
      });
    }

    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({
        ok: false,
        error: error.message,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}
