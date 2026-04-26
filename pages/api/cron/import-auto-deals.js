import { supabase } from "../../../lib/supabase";

const FEEDS = [
  {
    merchant: "Dealfeed",
    category: "tech",
    url: "https://www.mydealz.de/rss"
  }
];

// 🔥 Affiliate Regeln
function buildAffiliateLink(url = "") {
  if (!url) return "";

  // Amazon
  if (url.includes("amazon.")) {
    return url + (url.includes("?") ? "&" : "?") + "tag=deinamazon-21";
  }

  // Otto / AWIN Beispiel
  if (url.includes("otto.de")) {
    return `https://www.awin1.com/cread.php?awinmid=12345&awinaffid=DEINEID&clickref=deal&ued=${encodeURIComponent(url)}`;
  }

  return url;
}

function cleanHtml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1] : "";
}

function parsePrice(text = "") {
  const match = text.match(/(\d+[,.]\d{2})/);
  if (!match) return 0;
  return Number(match[1].replace(",", "."));
}

function parseImage(item = "") {
  const img = item.match(/<img[^>]+src="([^"]+)"/i);
  if (img?.[1]) return img[1];
  return "";
}

function isGoodDeal(title, price) {
  if (!title || title.length < 5) return false;
  if (!price || price <= 0) return false;
  if (price > 5000) return false;
  return true;
}

export default async function handler(req, res) {
  const secret = req.headers.authorization?.replace("Bearer ", "");

  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ ok: false });
  }

  let created = 0;
  let skipped = 0;

  try {
    for (const feed of FEEDS) {
      const response = await fetch(feed.url);
      const xml = await response.text();

      const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

      for (const item of items.slice(0, 30)) {
        const title = cleanHtml(extractTag(item, "title"));
        const link = cleanHtml(extractTag(item, "link"));
        const description = cleanHtml(extractTag(item, "description"));
        const price = parsePrice(title + " " + description);
        const image = parseImage(item);

        if (!isGoodDeal(title, price)) continue;

        const affiliateLink = buildAffiliateLink(link);

        const product = {
          name: title,
          description,
          price,
          category: "tech",
          merchant: feed.merchant,
          buy_link: affiliateLink,
          image,
          clicks: 0,
          source: "auto-money",
          created_at: new Date().toISOString()
        };

        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("buy_link", product.buy_link)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const { error } = await supabase.from("products").insert([product]);

        if (!error) created++;
        else skipped++;
      }
    }

    return res.status(200).json({
      ok: true,
      created,
      skipped
    });
  } catch (err) {
    return res.status(500).json({ ok: false });
  }
}
