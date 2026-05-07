import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;

    console.log("AUTH HEADER:", authHeader);
    console.log("ENV SECRET:", process.env.CRON_SECRET);

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized",
        received: authHeader || null,
        expected: process.env.CRON_SECRET ? "exists" : "missing",
      });
    }

    const { data, error } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (error) throw error;

    return res.status(200).json({
      ok: true,
      message: "Supabase ping successful",
      checked: data?.length || 0,
      time: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}
