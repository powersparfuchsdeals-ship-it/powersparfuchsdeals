import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";

const CATEGORIES = [
  { value: "all", label: "Alle Deals" },
  { value: "tv", label: "TV" },
  { value: "smartphone", label: "Smartphones" },
  { value: "laptop", label: "Laptops" },
  { value: "audio", label: "Audio" },
  { value: "gaming", label: "Gaming" },
  { value: "smarthome", label: "Smart Home" },
  { value: "price-error", label: "Preisfehler" }
];

// 🔥 Deal Qualität
function isGoodDeal(product) {
  const price = Number(product.price || 0);
  const name = String(product.name || "").trim();
  const buyLink = String(product.buy_link || "").trim();

  if (!name || name.length < 5) return false;
  if (!price || price <= 0) return false;
  if (price > 5000) return false;
  if (!buyLink) return false;

  return true;
}

// 🔥 Ranking Engine
function getDealScore(product) {
  let score = 0;

  const clicks = Number(product.clicks || 0);
  const price = Number(product.price || 0);
  const tag = String(product.tag || "").toLowerCase();
  const created = new Date(product.created_at || Date.now());

  const ageHours = (Date.now() - created.getTime()) / 1000 / 60 / 60;

  // 📈 Klicks
  score += Math.min(clicks, 150) * 3;

  // 🆕 Frische
  if (ageHours < 24) score += 150;
  else if (ageHours < 72) score += 90;
  else if (ageHours < 168) score += 40;

  // 🏷 Tags
  if (tag === "featured") score += 220;
  if (tag === "preisfehler") score += 340;

  // 💸 Preis attraktiv
  if (price > 0 && price < 10) score += 120;
  else if (price < 50) score += 80;
  else if (price < 300) score += 50;

  // 📦 Datenqualität
  if (product.image) score += 25;
  if (product.description) score += 20;

  return score;
}

export default function DealsPage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  }

  async function trackClick(product) {
    await supabase
      .from("products")
      .update({ clicks: Number(product.clicks || 0) + 1 })
      .eq("id", product.id);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, clicks: Number(p.clicks || 0) + 1 }
          : p
      )
    );
  }

  // 🔥 Ranking + Sortierung
  const ranked = useMemo(() => {
    return [...products]
      .filter(isGoodDeal)
      .map((p) => ({
        ...p,
        score: getDealScore(p)
      }))
      .sort((a, b) => b.score - a.score);
  }, [products]);

  // 🔍 Filter + Suche
  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return ranked.filter((p) => {
      const matchesCategory =
        category === "all" ||
        p.category === category ||
        (category === "price-error" && p.tag === "preisfehler");

      const matchesSearch =
        !q ||
        [p.name, p.description, p.category, p.tag, p.merchant]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [ranked, category, search]);

  const topDeals = ranked.slice(0, 8);

  const priceErrors = ranked.filter(
    (p) => p.tag === "preisfehler"
  ).slice(0, 8);

  return (
    <>
      <Head>
        <title>Tech Deals | Orbital-Noir</title>
      </Head>

      <div style={styles.page}>
        <header style={styles.header}>
          <h1>🔥 Orbital-Noir Deals</h1>
        </header>

        <main style={styles.main}>
          {/* TOP DEALS */}
          <h2>Top Deals</h2>
          <div style={styles.grid}>
            {topDeals.map((p) => (
              <ProductCard key={p.id} p={p} trackClick={trackClick} />
            ))}
          </div>

          {/* PREISFEHLER */}
          <h2>Preisfehler</h2>
          <div style={styles.grid}>
            {priceErrors.map((p) => (
              <ProductCard key={p.id} p={p} trackClick={trackClick} />
            ))}
          </div>

          {/* FILTER */}
          <h2>Alle Deals</h2>

          <div style={styles.filter}>
            <input
              placeholder="Suche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.grid}>
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} trackClick={trackClick} />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}

const styles = {
  page: {
    padding: 20
  },
  header: {
    marginBottom: 20
  },
  main: {
    display: "flex",
    flexDirection: "column",
    gap: 30
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 16
  },
  filter: {
    display: "flex",
    gap: 10
  }
};
