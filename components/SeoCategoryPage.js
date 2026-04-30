import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductCard from "./ProductCard";
import TopDealsSection from "./TopDealsSection";

function getFallbackScore(product) {
  let score = 0;

  const clicks = Number(product.clicks || 0);
  const price = Number(product.price || 0);

  score += Math.min(clicks, 100) * 2;

  if (price > 20 && price < 300) score += 80;
  if (price > 0 && price < 10) score += 40;

  const created = new Date(product.created_at || Date.now());
  const ageHours = (Date.now() - created.getTime()) / 1000 / 60 / 60;

  if (ageHours < 24) score += 120;
  if (ageHours < 72) score += 60;

  return score;
}

export default function SeoCategoryPage({
  title,
  description,
  category,
  searchKeywords = []
}) {
  const [products, setProducts] = useState([]);
  const [topDeals, setTopDeals] = useState([]);

  useEffect(() => {
    loadProducts();
    loadTopDeals();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  }

  async function loadTopDeals() {
    const res = await fetch("/api/top-deals?limit=6");
    const data = await res.json();
    if (data?.ok) setTopDeals(data.items || []);
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const text = [
        p.name,
        p.description,
        p.category,
        p.import_query,
        p.tag,
        p.merchant
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesCategory =
        category === "all" ||
        String(p.category || "").toLowerCase() === category;

      const matchesKeywords =
        searchKeywords.length === 0 ||
        searchKeywords.some((kw) => text.includes(kw.toLowerCase()));

      return matchesCategory || matchesKeywords;
    });
  }, [products, category, searchKeywords]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts]
      .map((p) => ({
        ...p,
        score: Number(p.deal_score || 0) || getFallbackScore(p)
      }))
      .sort((a, b) => b.score - a.score);
  }, [filteredProducts]);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>{title}</h1>
      <p style={{ color: "#555", marginBottom: "20px" }}>{description}</p>

      <TopDealsSection products={topDeals} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px",
          marginTop: "20px"
        }}
      >
        {sortedProducts.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
