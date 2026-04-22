import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import TopDealsSection from "../components/TopDealsSection";

/* ------------------ SCORE SYSTEM ------------------ */
function getProductScore(p) {
  let score = 0;

  // Klicks (max capped)
  score += Math.min(p.clicks || 0, 100) * 2;

  // Tags
  if (p.tag === "featured") score += 200;
  if (p.tag === "preisfehler") score += 300;

  // Preis Logik
  const price = Number(p.price || 0);
  if (price > 20 && price < 300) score += 80;
  if (price < 10) score += 40;

  // Frische Produkte
  const created = new Date(p.created_at || Date.now());
  const ageHours = (Date.now() - created.getTime()) / 1000 / 60 / 60;
  if (ageHours < 24) score += 120;

  return score;
}

/* ------------------ COLORS ------------------ */
const COLORS = [
  "#2b2f3a",
  "#30364a",
  "#34405c",
  "#2f4a63",
  "#3a4757",
  "#4a3a55",
  "#2e5a4a",
  "#5a4a2e"
];

function hexToRgb(hex) {
  const int = parseInt(hex.replace("#", ""), 16);
  return { r: int >> 16, g: (int >> 8) & 255, b: int & 255 };
}

function mix(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t)
  };
}

function toCss(c) {
  return `rgb(${c.r},${c.g},${c.b})`;
}

/* ------------------ PAGE ------------------ */
export default function Home() {
  const [products, setProducts] = useState([]);
  const [session, setSession] = useState(null);
  const [bgA, setBgA] = useState(COLORS[0]);
  const [bgB, setBgB] = useState(COLORS[1]);

  const animRef = useRef(null);
  const lastColors = useRef({ a: COLORS[0], b: COLORS[1] });

  /* -------- LOAD -------- */
  useEffect(() => {
    loadProducts();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  }

  async function trackClick(p) {
    await supabase
      .from("products")
      .update({ clicks: (p.clicks || 0) + 1 })
      .eq("id", p.id);
  }

  /* -------- SMOOTH BACKGROUND -------- */
  useEffect(() => {
    const fromA = hexToRgb(lastColors.current.a);
    const fromB = hexToRgb(lastColors.current.b);
    const toA = hexToRgb(bgA);
    const toB = hexToRgb(bgB);

    let start = null;
    const duration = 12000;

    function animate(t) {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);

      const cA = mix(fromA, toA, p);
      const cB = mix(fromB, toB, p);

      document.body.style.background = `linear-gradient(135deg, ${toCss(cA)}, ${toCss(cB)})`;

      if (p < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        lastColors.current = { a: bgA, b: bgB };
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [bgA, bgB]);

  /* -------- AUTO COLOR LOOP -------- */
  useEffect(() => {
    const i = setInterval(() => {
      setBgA((prev) => {
        const idx = COLORS.indexOf(prev);
        const next = (idx + 1) % COLORS.length;
        setBgB(COLORS[(next + 1) % COLORS.length]);
        return COLORS[next];
      });
    }, 300000);

    return () => clearInterval(i);
  }, []);

  /* -------- SORTED PRODUCTS -------- */
  const sortedProducts = useMemo(() => {
    return [...products]
      .map((p) => ({ ...p, score: getProductScore(p) }))
      .sort((a, b) => b.score - a.score);
  }, [products]);

  /* -------- TOP DEALS -------- */
  const topDeals = useMemo(() => sortedProducts.slice(0, 8), [sortedProducts]);

  /* -------- RENDER -------- */
  return (
    <div style={{ padding: 20 }}>
      <header style={{ marginBottom: 20 }}>
        <h1>Orbital-Noir</h1>
      </header>

      {/* TOP DEALS */}
      <TopDealsSection products={topDeals} trackClick={trackClick} />

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))",
          gap: 16
        }}
      >
        {sortedProducts.map((p) => (
          <ProductCard key={p.id} p={p} trackClick={trackClick} />
        ))}
      </div>
    </div>
  );
}
