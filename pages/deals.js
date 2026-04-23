import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";

const CATEGORIES = [
  { value: "all", label: "Alle Deals" },
  { value: "tv", label: "TV" },
  { value: "smartphone", label: "Smartphones" },
  { value: "laptop", label: "Laptops" },
  { value: "audio", label: "Audio" },
  { value: "gaming", label: "Gaming" },
  { value: "price-error", label: "Preisfehler" }
];

export default function DealsPage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("clicks", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error) setProducts(data || []);
  }

  async function trackClick(product) {
    await supabase
      .from("products")
      .update({ clicks: Number(product.clicks || 0) + 1 })
      .eq("id", product.id);
  }

  const filtered = useMemo(() => {
    if (category === "all") return products;
    return products.filter(
      (p) => String(p.category || "").toLowerCase() === category
    );
  }, [products, category]);

  const topDeals = useMemo(() => {
    return [...products]
      .sort((a, b) => Number(b.clicks || 0) - Number(a.clicks || 0))
      .slice(0, 8);
  }, [products]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <a href="/" style={styles.logo}>Tech Deals</a>

        <nav style={styles.nav}>
          <a href="/preisfehler" style={styles.navLink}>Preisfehler</a>
          <a href="/impressum" style={styles.navLink}>Impressum</a>
          <a href="/datenschutz" style={styles.navLink}>Datenschutz</a>
        </nav>
      </header>

      <main style={styles.shell}>
        <section style={styles.hero}>
          <div>
            <div style={styles.label}>Täglich aktualisierte Technik-Angebote</div>
            <h1 style={styles.title}>
              Die besten Tech Deals, Preisfehler und Schnäppchen.
            </h1>
            <p style={styles.text}>
              Wir sammeln aktuelle Technik-Angebote aus verschiedenen Kategorien und
              sortieren sie nach Beliebtheit, Preis und Deal-Potenzial.
            </p>

            <div style={styles.actions}>
              <a href="#deals" style={styles.primaryBtn}>Deals ansehen</a>
              <a href="/preisfehler" style={styles.secondaryBtn}>Preisfehler</a>
            </div>
          </div>

          <div style={styles.trustBox}>
            <h2 style={styles.trustTitle}>Warum diese Seite?</h2>
            <p style={styles.trustText}>
              Fokus auf klare Angebote, direkte Kauf-Links und schnelle Orientierung.
              Affiliate-Links sind als solche eingebunden und verursachen keine Mehrkosten.
            </p>
          </div>
        </section>

        <section style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <strong>Tech Fokus</strong>
            <span>TV, Smartphones, Audio, Gaming und Zubehör.</span>
          </div>
          <div style={styles.infoCard}>
            <strong>Deal Ranking</strong>
            <span>Beliebte Produkte werden automatisch stärker gewichtet.</span>
          </div>
          <div style={styles.infoCard}>
            <strong>Transparenz</strong>
            <span>Mit Impressum, Datenschutz und Affiliate-Hinweis.</span>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.label}>Top Auswahl</div>
              <h2 style={styles.sectionTitle}>Beliebte Deals</h2>
            </div>
            <p style={styles.smallText}>Nach Klicks und Aktualität sortiert.</p>
          </div>

          <div style={styles.grid}>
            {topDeals.map((p) => (
              <ProductCard key={p.id} p={p} trackClick={trackClick} />
            ))}
          </div>
        </section>

        <section id="deals" style={styles.section}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.label}>Alle Angebote</div>
              <h2 style={styles.sectionTitle}>Aktuelle Tech Deals</h2>
            </div>
            <p style={styles.smallText}>{filtered.length} Angebote gefunden</p>
          </div>

          <div style={styles.pills}>
            {CATEGORIES.map((item) => (
              <button
                key={item.value}
                onClick={() => setCategory(item.value)}
                style={category === item.value ? styles.pillActive : styles.pill}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={styles.grid}>
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} trackClick={trackClick} />
            ))}
          </div>
        </section>

        <section style={styles.contentBox}>
          <h2>Über unsere Technik-Angebote</h2>
          <p>
            Diese Deal-Seite richtet sich an Nutzer, die schnell gute Technik-Angebote
            finden möchten. Der Fokus liegt auf Smartphones, Fernsehern, Laptops,
            Audio-Produkten, Gaming-Zubehör und auffälligen Preisfehlern.
          </p>
          <p>
            Einige Links können Affiliate-Links sein. Wenn darüber ein Kauf entsteht,
            kann eine Provision gezahlt werden. Für dich bleibt der Preis gleich.
          </p>
        </section>

        <footer style={styles.footer}>
          <a href="/impressum">Impressum</a>
          <span>•</span>
          <a href="/datenschutz">Datenschutz</a>
        </footer>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #fff7c2 0%, #ffd166 35%, #e76f51 75%, #355070 100%)",
    color: "#111827",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  header: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "22px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap"
  },
  logo: {
    color: "#111827",
    textDecoration: "none",
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: "-0.04em"
  },
  nav: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap"
  },
  navLink: {
    color: "#111827",
    textDecoration: "none",
    fontWeight: 600
  },
  shell: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "8px 16px 50px"
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.6fr)",
    gap: "22px",
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.55)",
    borderRadius: "28px",
    padding: "34px",
    boxShadow: "0 18px 60px rgba(0,0,0,0.1)"
  },
  label: {
    color: "#6b7280",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 800,
    marginBottom: "12px"
  },
  title: {
    margin: 0,
    maxWidth: "760px",
    fontSize: "clamp(38px, 5vw, 72px)",
    lineHeight: 0.98,
    letterSpacing: "-0.06em"
  },
  text: {
    maxWidth: "680px",
    color: "#4b5563",
    fontSize: "18px",
    lineHeight: 1.7
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "22px"
  },
  primaryBtn: {
    display: "inline-flex",
    minHeight: "46px",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 18px",
    borderRadius: "12px",
    background: "#111827",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700
  },
  secondaryBtn: {
    display: "inline-flex",
    minHeight: "46px",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 18px",
    borderRadius: "12px",
    background: "#fff",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 700,
    border: "1px solid #d1d5db"
  },
  trustBox: {
    background: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(17,24,39,0.08)",
    borderRadius: "22px",
    padding: "22px",
    alignSelf: "stretch"
  },
  trustTitle: {
    marginTop: 0,
    marginBottom: "10px"
  },
  trustText: {
    color: "#4b5563",
    lineHeight: 1.65
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    marginTop: "22px"
  },
  infoCard: {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.55)",
    borderRadius: "20px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.08)"
  },
  section: {
    marginTop: "34px"
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px"
  },
  sectionTitle: {
    margin: 0,
    fontSize: "34px",
    letterSpacing: "-0.04em"
  },
  smallText: {
    color: "#374151",
    margin: 0
  },
  pills: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "18px"
  },
  pill: {
    minHeight: "38px",
    padding: "0 13px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    background: "rgba(255,255,255,0.9)",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 600
  },
  pillActive: {
    minHeight: "38px",
    padding: "0 13px",
    borderRadius: "999px",
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px"
  },
  contentBox: {
    marginTop: "34px",
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(255,255,255,0.55)",
    borderRadius: "24px",
    padding: "26px",
    color: "#374151",
    lineHeight: 1.75
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "26px",
    color: "#111827"
  }
};
