import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import TopDealsSection from "../components/TopDealsSection";

const BACKGROUND_COLORS = [
  "#2b2f3a",
  "#30364a",
  "#34405c",
  "#2f4a63",
  "#3a4757",
  "#4a3a55",
  "#2e5a4a",
  "#5a4a2e",
  "#4a4a50",
  "#314a63"
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [session, setSession] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
  const [nextColor, setNextColor] = useState(BACKGROUND_COLORS[1]);
  const [autoMode, setAutoMode] = useState(true);

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
  const userEmail = (session?.user?.email || "").toLowerCase();
  const isAdmin = !!userEmail && userEmail === adminEmail;

  useEffect(() => {
    loadProducts();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.background = `linear-gradient(135deg, ${backgroundColor}, ${nextColor})`;
    document.body.style.transition = "background 4s ease-in-out";
  }, [backgroundColor, nextColor]);

  useEffect(() => {
    if (!autoMode) return;

    const interval = setInterval(() => {
      setBackgroundColor((prev) => {
        const i = BACKGROUND_COLORS.indexOf(prev);
        const next = (i + 1) % BACKGROUND_COLORS.length;
        setNextColor(BACKGROUND_COLORS[(next + 1) % BACKGROUND_COLORS.length]);
        return BACKGROUND_COLORS[next];
      });
    }, 1800000);

    return () => clearInterval(interval);
  }, [autoMode]);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("clicks", { ascending: false });

    setProducts(data || []);
  }

  async function trackClick(product) {
    await supabase
      .from("products")
      .update({ clicks: (product.clicks || 0) + 1 })
      .eq("id", product.id);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div style={{ color: "#111827" }}>
      
      {/* NAVBAR */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "20px 30px"
      }}>
        <strong>Orbital-Noir</strong>

        <div style={{ display: "flex", gap: "20px" }}>
          {isAdmin && <a href="/admin">Admin</a>}

          {session ? (
            <>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <a href="/login">Login</a>
              <a href="/register">Register</a>
            </>
          )}
        </div>
      </div>

      {/* HERO */}
      <div style={{ padding: "40px 30px" }}>
        <h1>Die besten Tech Deals – täglich aktualisiert</h1>
        <p>Finde sofort kaufbare Produkte mit direkten Links.</p>
      </div>

      {/* 🔥 TOP DEALS */}
      <TopDealsSection products={products} trackClick={trackClick} />

      {/* PRODUKTE */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))",
        gap: "20px",
        padding: "30px"
      }}>
        {products.map((p) => (
          <ProductCard key={p.id} p={p} trackClick={trackClick} />
        ))}
      </div>

    </div>
  );
}
