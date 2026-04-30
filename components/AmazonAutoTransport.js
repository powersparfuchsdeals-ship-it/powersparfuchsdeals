import { useState } from "react";

export default function AmazonAutoTransport({ onProductAdded }) {
  const [amazonUrl, setAmazonUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function addProduct() {
    if (!amazonUrl.trim()) {
      alert("Bitte Amazon-Link oder ASIN eingeben");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin-add-amazon-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amazonUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Fehler beim Hinzufügen");
        return;
      }

      setAmazonUrl("");
      onProductAdded?.();
    } catch (err) {
      console.error(err);
      alert("Serverfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, background: "#fff", borderRadius: 10 }}>
      <h2>Amazon Auto Transport</h2>

      <input
        value={amazonUrl}
        onChange={(e) => setAmazonUrl(e.target.value)}
        placeholder="Amazon Link oder ASIN"
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      <button onClick={addProduct} disabled={loading}>
        {loading ? "Lädt..." : "Amazon Produkt hinzufügen"}
      </button>
    </div>
  );
}
