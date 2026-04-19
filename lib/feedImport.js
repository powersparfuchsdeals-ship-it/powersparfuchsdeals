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
