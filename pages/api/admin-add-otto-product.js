export default function handler(req, res) {
  return res.status(503).json({
    ok: false,
    error: "OTTO Import deaktiviert",
  });
}
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Holt Titel + Bild von OTTO
async function fetchOttoMeta(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = await res.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const imageMatch = html.match(
      /<meta property="og:image" content="(.*?)"/i
    );

    return {
      title: titleMatch ? titleMatch[1].trim() : null,
      image: imageMatch ? imageMatch[1] : null,
    };
  } catch (err) {
    console.error("OTTO Fetch Fehler:", err);
    return { title: null, image: null };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { ottoUrl } = req.body;

  if (!ottoUrl || !ottoUrl.includes("otto.de")) {
    return res.status(400).json({
      ok: false,
      error: "Bitte gültigen OTTO-Link eingeben",
    });
  }

  try {
    const meta = await fetchOttoMeta(ottoUrl);

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          title: meta.title || "OTTO Produkt",
          image: meta.image || null,
          price: null,
          url: ottoUrl,
          source: "otto_auto",
          category: "otto",
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        ok: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      ok: true,
      product: data,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      ok: false,
      error: "Server Fehler",
    });
  }
}
