import { supabase } from "../../../lib/supabase";

const FEEDS = [
  {
    merchant: "Dealfeed",
    category: "tech",
    url: "https://www.mydealz.de/rss"
  }
];

function cleanHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function extractTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? cleanHtml(match[1]) : "";
}

function extractCdata(value = "") {
  return String(value).replace("<![CDATA[", "").replace("]]>", "").trim();
}

function parsePrice(text = "") {
  const match = String(text).match(/(\d+[,.]\d{2})\s?€/);
  if (!match) return 0;
  return Number(match[1].replace(",", "."));
}

function parseImage(item = "") {
  const enclosure = item.match(/<enclosure[^>]+url="([^"]+)"/i);
  if (enclosure?.[1]) return enclosure[1];

  const img = item.match(/<img[^>]+src="([^"]+)"/i);
  if (img?.[1]) return img[1];

  return "";
}

function parseFeed(xml, feed) {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  const parsed = items
    .map((item) => {
      const rawTitle = extractCdata(extractTag(item, "title"));
      const title = cleanHtml(rawTitle);
      const link = extractCdata(extractTag(item, "link"));
      const description = cleanHtml(extractCdata(extractTag(item, "description")));
      const price = parsePrice(`${title} ${description}`);
      const image = parseImage(item);

      if (!title || !link) return null;

      return {
        name: title.slice(0, 180),
        description: description.slice(0, 500),
        price,
        old_price: 0,
        category: feed.category || "tech",
        merchant: feed.merchant || "Feed",
        buy_link: link,
        image,
        tag: title.toLowerCase().includes("preisfehler") ? "preisfehler" : "",
        commission_rate: 0.03,
        clicks: 0,
        source: "auto-feed",
        created_at: new Date().toISOString()
      };
    })
    .filter(Boolean);

  return {
    itemsFound: items.length,
    parsedFound: parsed.length,
    dealsWithPrice: parsed.filter((p) => p.price > 0),
    sample: parsed.slice(0, 3)
  };
}

export default async function handler(req, res) {
  const secret = req.headers.authorization?.replace("Bearer ", "");

  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  let created = 0;
  let skipped = 0;
  const debug = [];

  try {
    for (const feed of FEEDS) {
      const response = await fetch(feed.url);
      const xml = await response.text();

      const parsedResult = parseFeed(xml, feed);
      const deals = parsedResult.dealsWithPrice.slice(0, 30);

      debug.push({
        feed: feed.url,
        httpStatus: response.status,
        xmlLength: xml.length,
        itemsFound: parsedResult.itemsFound,
        parsedFound: parsedResult.parsedFound,
        dealsWithPrice: parsedResult.dealsWithPrice.length,
        sample: parsedResult.sample
      });

      for (const deal of deals) {
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("buy_link", deal.buy_link)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const { error } = await supabase.from("products").insert([deal]);

        if (!error) created++;
        else skipped++;
      }
    }

    return res.status(200).json({
      ok: true,
      created,
      skipped,
      debug
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Auto import failed",
      debug
    });
  }
}
