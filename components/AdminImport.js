import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminImport() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMsg("Import läuft...");

    try {
      const text = await file.text();
      const rows = text.split(/\r?\n/).slice(1);

      const products = rows
        .map((row) => {
          const [name, price, category, buy_link, image, description] = row.split(",");
          if (!name) return null;

          return {
            name: name.trim(),
            price: Number(price || 0),
            category: category?.trim() || "other",
            buy_link: buy_link?.trim() || "",
            image: image?.trim() || "",
            description: description?.trim() || "",
            clicks: 0,
            source: "csv",
            created_at: new Date().toISOString()
          };
        })
        .filter(Boolean);

      const { error } = await supabase.from("products").insert(products);

      if (error) {
        setMsg(`❌ Fehler: ${error.message}`);
      } else {
        setMsg(`✅ ${products.length} Produkte importiert`);
      }
    } catch (err) {
      setMsg("❌ CSV konnte nicht gelesen werden");
    }

    setLoading(false);
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <h3>CSV Import</h3>
      <input type="file" accept=".csv" onChange={handleFile} disabled={loading} />
      <p>{msg}</p>
    </div>
  );
}
