// lib/feedImport.js
import crypto from "crypto";
import { buildSmartProduct, detectVendor, normalizeUrl } from "./smartImport";

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result.map((v) => v.replace(/^"(.*)"$/, "$1").trim());
}

export function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = {};

    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    return row;
  });
}

export function parseFeedText(feedText) {
  if (!feedText?.trim()) return [];

  const trimmed = feedText.trim();

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  }

  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed?.items)) return parsed.items;
    return [];
  }

  return parseCsv(trimmed);
}

function normalizePrice(value) {
  if (value === null || value === undefined || value === "") return "0";
  const cleaned = String(value).replace(",", ".").replace(/[^\d.]/g, "");
  return cleaned || "0";
}

export function normalizeFeedItems(items = []) {
  return items.map((item, index) => {
    const rawLink = item.buy_link || item.link || item.url || "";
    const normalizedLink = normalizeUrl(rawLink);

    const built = buildSmartProduct({
      link: normalizedLink,
      title:
        item.name ||
        item.title ||
        `${item.vendor || detectVendor(rawLink) || "Import"} ${index + 1}`,
      price: normalizePrice(item.price),
      category: item.category || "",
      description: item.description || ""
    });

    return {
      name: item.name || item.title || built.name || "",
      price: normalizePrice(item.price || built.price || "0"),
      description: item.description || built.description || "",
      buy_link: normalizedLink || built.buy_link || "",
      image: item.image || built.image || null
    };
  });
}

export function buildContentHash(items = []) {
  const normalized = normalizeFeedItems(items);

  const stable = JSON.stringify(
    normalized.map((row) => ({
      name: row.name || "",
      price: String(row.price ?? ""),
      description: row.description || "",
      buy_link: row.buy_link || "",
      image: row.image || ""
    }))
  );

  return crypto.createHash("sha256").update(stable).digest("hex");
}

export async function importFeedRows({ supabase, items, userId }) {
  const normalizedRows = normalizeFeedItems(items).filter(
    (row) => row.name && row.buy_link
  );

  if (!normalizedRows.length) {
    return {
      created: 0,
      updated: 0,
      skipped: items.length
    };
  }

  const buyLinks = [...new Set(normalizedRows.map((row) => row.buy_link).filter(Boolean))];

  const { data: existingRows, error: existingError } = await supabase
    .from("products")
    .select("id, buy_link")
    .in("buy_link", buyLinks);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingByLink = new Map(
    (existingRows || []).map((row) => [row.buy_link, row])
  );

  const toInsert = [];
  const toUpdate = [];

  for (const row of normalizedRows) {
    const existing = existingByLink.get(row.buy_link);

    const payload = {
      name: row.name,
      price: row.price,
      description: row.description || "",
      buy_link: row.buy_link,
      image: row.image || null
    };

    if (existing) {
      toUpdate.push({
        id: existing.id,
        ...payload
      });
    } else {
      toInsert.push({
        ...payload,
        user_id: userId
      });
    }
  }

  let created = 0;
  let updated = 0;

  if (toInsert.length) {
    const { error } = await supabase.from("products").insert(toInsert);
    if (error) throw new Error(error.message);
    created = toInsert.length;
  }

  for (const row of toUpdate) {
    const { id, ...payload } = row;
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
    updated++;
  }

  return {
    created,
    updated,
    skipped: items.length - normalizedRows.length
  };
}
