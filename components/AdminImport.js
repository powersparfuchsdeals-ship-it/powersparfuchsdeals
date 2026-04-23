import { useState } from "react";
import { supabase } from "../lib/supabase";
import AdminImport from "../components/AdminImport";

export default function AdminImport() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMsg("Import läuft...");

    const text = await file.text();
    const rows = text.split("\n").slice(1);

    const products = rows
      .map((row) => {
        const [name, price, category, link] = row.split(",");
        if (!name) return null;

        return {
          name: name.trim(),
          price: Number(price),
          category: category?.trim() || "other",
          link: link?.trim(),
          clicks: 0,
          created_at: new Date().toISOString()
        };
      })
      .filter(Boolean);

    const { error } = await supabase.from("products").insert(products);

    if (error) {
      setMsg("❌ Fehler beim Import");
    } else {
      setMsg(`✅ ${products.length} Produkte importiert`);
    }

    setLoading(false);
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <h3>CSV Import</h3>
      <input type="file" accept=".csv" onChange={handleFile} />
      <p>{msg}</p>
    </div>
  );
}
