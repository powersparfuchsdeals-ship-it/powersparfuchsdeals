import { supabase } from "../../../lib/supabase";

const FEEDS = [
  {
    merchant: "Dealfeed",
    category: "tech",
    url: "https://www.mydealz.de/rss"
  }
];

const BLOCK_WORDS = [
  "dvd",
  "blu-ray",
  "bluray",
  "4k steelbook",
  "steelbook",
  "film",
  "movie",
  "roman",
  "buch",
  "kindle ebook",
  "hörbuch",
  "lebensmittel",
  "kaffee",
  "wein",
  "bier",
  "sneaker",
  "schuhe",
  "kleidung",
  "shirt",
  "hose",
  "jacke",
  "spielzeug",
  "drogerie",
  "parfum",
  "kosmetik",
  "reise",
  "hotel",
  "flug",
  "gutschein",
  "lieferando",
  "restaurant"
];

const TECH_WORDS = [
  "iphone",
  "ipad",
  "macbook",
  "samsung",
  "galaxy",
  "pixel",
  "smartphone",
  "handy",
  "tablet",
  "laptop",
  "notebook",
  "pc",
  "monitor",
  "gaming",
  "playstation",
  "ps5",
  "xbox",
  "nintendo",
  "switch",
  "steam",
  "ssd",
  "hdd",
  "nvme",
  "ram",
  "grafikkarte",
  "rtx",
  "radeon",
  "cpu",
  "ryzen",
  "intel",
  "mainboard",
  "router",
  "fritzbox",
  "wifi",
  "wlan",
  "kopfhörer",
  "headset",
  "soundbar",
  "lautsprecher",
  "airpods",
  "bluetooth",
  "tv",
  "fernseher",
  "oled",
  "qled",
  "smart home",
  "alexa",
  "echo",
  "hue",
  "kamera",
  "webcam",
  "drucker",
  "beamer",
  "anker",
  "ugreen",
  "razer",
  "logitech",
  "asus",
  "acer",
  "lenovo",
  "dell",
  "hp",
  "msi",
  "sony",
  "lg"
];

function cleanHtml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(item = "", tag = "") {
  const patterns = [
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
    new RegExp(`<[^:>]+:${tag}[^>]*>([\\s\\S]*?)<\\/[^:>]+:${tag}>`, "i")
  ];

  for (const pattern of patterns) {
    const match = item.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

function extractLink(item = "") {
  const linkTag = extractTag(item, "link");
  if (linkTag) return cleanHtml(linkTag);

  const atomLink = item.match(/<link[^>]+href="([^"]+)"/i);
  if (atomLink?.[1]) return atomLink[1].trim();

  return "";
}

function parsePrice(text = "") {
  const cleaned = cleanHtml(text);

  const patterns = [
    /(\d{1,4}(?:[.,]\d{2})?)\s?€/,
    /€\s?(\d{1,4}(?:[.,]\d{2})?)/
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      return Number(match[1].replace(",", "."));
    }
  }

  return 0;
}

function parseImage(item = "") {
  const enclosure = item.match(/<enclosure[^>]+url="([^"]+)"/i);
  if (enclosure?.[1]) return enclosure[1].trim();

  const mediaContent = item.match(/<media:content[^>]+url="([^"]+)"/i);
  if (mediaContent?.[1]) return mediaContent[1].trim();

  const mediaThumb = item.match(/<media:thumbnail[^>]+url="([^"]+)"/i);
  if (mediaThumb?.[1]) return mediaThumb[1].trim();

  const img = item.match(/<img[^>]+src="([^"]+)"/i);
  if (img?.[1]) return img[1].trim();

  return "";
}

function inferCategory(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("iphone") || text.includes("smartphone") || text.includes("samsung galaxy") || text.includes("pixel")) {
    return "smartphone";
  }

  if (text.includes("tv") || text.includes("fernseher") || text.includes("oled") || text.includes("qled")) {
    return "tv";
  }

  if (text.includes("laptop") || text.includes("notebook") || text.includes("macbook")) {
    return "laptop";
  }

  if (text.includes("kopfhörer") || text.includes("headset") || text.includes("soundbar") || text.includes("airpods") || text.includes("lautsprecher")) {
    return "audio";
  }

  if (text.includes("gaming") || text.includes("playstation") || text.includes("ps5") || text.includes("xbox") || text.includes("nintendo") || text.includes("steam") || text.includes("razer")) {
    return "gaming";
  }

  if (text.includes("smart home") || text.includes("alexa") || text.includes("echo") || text.includes("hue")) {
    return "smarthome";
  }

  if (text.includes("ssd") || text.includes("nvme") || text.includes("ram") || text.includes("rtx") || text.includes("radeon") || text.includes("ryzen") || text.includes("intel")) {
    return "pc";
  }

  return "tech";
}

function isSmartDeal({ title, description, price }) {
  const text = `${title} ${description}`.toLowerCase();

  if (!title || title.length < 5) return false;
  if (!price || price <= 0) return false;
  if (price > 3000) return false;

  const hasBlockedWord = BLOCK_WORDS.some((word) => text.includes(word));
  if (hasBlockedWord) return false;

  const hasTechWord = TECH_WORDS.some((word) => text.includes(word));
  if (!hasTechWord) return false;

  return true;
}

function getDealTag(title = "", description = "", price = 0) {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("preisfehler") || text.includes("glitch")) {
    return "preisfehler";
  }

  if (price > 0 && price < 10) {
    return "featured";
  }

  return "";
}

function parseFeed(xml, feed) {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  const parsed = items
    .map((item) => {
      const title = cleanHtml(extractTag(item, "title"));
      const link = extractLink(item);
      const description = cleanHtml(extractTag(item, "description"));
      const price = parsePrice(`${title} ${description}`);
      const image = parseImage(item);

      if (!title || !link) return null;

      const allowed = isSmartDeal({ title, description, price });
      if (!allowed) return null;

      return {
        name: title.slice(0, 180),
        description: description.slice(0, 500),
        price,
        old_price: 0,
        category: inferCategory(title, description) || feed.category || "tech",
        merchant: feed.merchant || "Feed",
        buy_link: link,
        image,
        tag: getDealTag(title, description, price),
        commission_rate: 0.03,
        clicks: 0,
        source: "auto-feed-smart",
        created_at: new Date().toISOString()
      };
    })
    .filter(Boolean);

  return {
    itemsFound: items.length,
    parsedFound: parsed.length,
    dealsWithPrice: parsed.filter((p) => Number(p.price || 0) > 0),
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
      const response = await fetch(feed.url, {
        headers: {
          "User-Agent": "Orbital-Noir-Deals/1.0"
        }
      });

      const xml = await response.text();
      const parsedResult = parseFeed(xml, feed);
      const deals = parsedResult.dealsWithPrice.slice(0, 30);

      debug.push({
        feed: feed.url,
        httpStatus: response.status,
        xmlLength: xml.length,
        itemsFound: parsedResult.itemsFound,
        smartDealsFound: parsedResult.parsedFound,
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

        if (!error) {
          created++;
        } else {
          skipped++;
        }
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
