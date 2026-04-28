import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import DealCard from "../components/DealCard";

const CATEGORIES = [
  { value: "all", label: "Alle Deals" },
  { value: "tv", label: "TV" },
  { value: "smartphone", label: "Smartphones" },
  { value: "laptop", label: "Laptops" },
  { value: "audio", label: "Audio" },
  { value: "gaming", label: "Gaming" },
  { value: "smarthome", label: "Smart Home" },
  { value: "price-error", label: "Preisfehler" },
];

function isGoodDeal(product) {
  const price = Number(product.price || 0);
  const name = String(product.name || product.title || "").trim();
  const buyLink = String(
    product.buy_link || product.link || product.url || product.affiliate_url || ""
  ).trim();

  return name.length >= 5 && price > 0 && price <= 5000 && !!buyLink;
}

function getDealScore(product) {
  let score = 0;

  const clicks = Number(product.clicks || 0);
  const price = Number(product.price || 0);
  const tag = String(product.tag || "").toLowerCase();
  const category = String(product.category || "").toLowerCase();
  const created = new Date(product.created_at || Date.now());
  const ageHours = (Date.now() - created.getTime()) / 1000 / 60 / 60;

  score += Math.min(clicks, 150) * 3;

  if (tag === "featured") score += 220;
  if (tag === "preisfehler") score += 340;
  if (category === "price-error") score += 240;

  if (ageHours < 24) score += 150;
  else if (ageHours < 72) score += 90;
  else if (ageHours < 168) score += 45;

  if (price > 0 && price < 10) score += 120;
  else if (price < 50) score += 80;
  else if (price < 300) score += 50;

  if (product.image) score += 25;
  if (product.description) score += 20;
  if (product.merchant) score += 15;

  return score;
}

function normalizeDeal(p) {
  return {
    ...p,
    title: p.title || p.name || "Unbekannter Deal",
    image: p.image || p.thumbnail || "/placeholder.png",
    price: Number(p.price || 0),
    oldPrice: Number(p.oldPrice || p.old_price || p.original_price || 0),
    affiliateUrl:
      p.affiliateUrl ||
      p.affiliate_url ||
      p.buy_link ||
      p.link ||
      p.url ||
      "",
  };
}

export default function DealsPage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setProducts(data || []);
  }

  async function trackClick(product) {
    await supabase
      .from("products")
      .update({ clicks: Number(product.clicks || 0) + 1 })
      .eq("id", product.id);

    await supabase.from("tracking_events").insert([
      {
        product_id: product.id,
        deal_id: product.id,
        type: "click",
        created_at: new Date().toISOString(),
      },
    ]);

    setProducts((prev) =>
      prev.map((item) =>
        item.id === product.id
          ? { ...item, clicks: Number(item.clicks || 0) + 1 }
          : item
      )
    );
  }

  async function handleDealClick(deal) {
    await trackClick(deal);

    const url =
      deal.affiliateUrl ||
      deal.affiliate_url ||
      deal.buy_link ||
      deal.link ||
      deal.url;

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  const ranked = useMemo(() => {
    return [...products]
      .filter(isGoodDeal)
      .map((p) => normalizeDeal({ ...p, deal_score: getDealScore(p) }))
      .sort((a, b) => b.deal_score - a.deal_score);
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return ranked.filter((p) => {
      const productCategory = String(p.category || "").toLowerCase();
      const tag = String(p.tag || "").toLowerCase();

      const matchesCategory =
        category === "all" ||
        productCategory === category ||
        (category === "price-error" && tag === "preisfehler");

      const matchesSearch =
        !q ||
        [p.name, p.title, p.description, p.category, p.tag, p.merchant, p.source]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [ranked, category, search]);

  const topDeals = ranked.slice(0, 8);

  const priceErrors = ranked
    .filter(
      (p) =>
        String(p.tag || "").toLowerCase() === "preisfehler" ||
        String(p.category || "").toLowerCase() === "price-error"
    )
    .slice(0, 8);

  return (
    <>
      <Head>
        <title>Tech Deals & Preisfehler täglich | Orbital-Noir Deals</title>
        <meta
          name="description"
          content="Täglich aktualisierte Tech Deals, Preisfehler und Schnäppchen aus den Bereichen Smartphones, TV, Gaming, Audio, Laptops und Smart Home."
        />
      </Head>

      <div style={styles.page}>
        <header style={styles.header}>
          <a href="/" style={styles.logo}>Orbital-Noir Deals</a>

          <nav style={styles.nav}>
            <a href="#top-deals" style={styles.navLink}>Top Deals</a>
            <a href="#preisfehler" style={styles.navLink}>Preisfehler</a>
            <a href="#alle-deals" style={styles.navLink}>Alle Angebote</a>
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
                Wir analysieren Angebote aus Elektronik, Gaming, Smartphones,
                TV, Audio, Laptops und Smart Home. Die besten Deals werden nach
                Preis, Beliebtheit, Frische und Deal-Signal sortiert.
              </p>

              <div style={styles.actions}>
                <a href="#top-deals" style={styles.primaryBtn}>Top Deals ansehen</a>
                <a href="#alle-deals" style={styles.secondaryBtn}>Alle Angebote</a>
              </div>

              <p style={styles.affiliateNote}>
                * Einige Links sind Affiliate-Links. Wenn du darüber kaufst,
                kann eine Provision entstehen. Für dich bleibt der Preis gleich.
              </p>
            </div>

            <div style={styles.trustBox}>
              <h2 style={styles.trustTitle}>Warum Orbital-Noir Deals?</h2>
              <ul style={styles.trustList}>
                <li>✔ Fokus auf echte Technik-Angebote</li>
                <li>✔ Automatisch aktualisierte Deal-Auswahl</li>
                <li>✔ Preisfehler und Top Deals separat sichtbar</li>
                <li>✔ Klare Kategorien statt Produktflut</li>
                <li>✔ Transparente Affiliate-Hinweise</li>
              </ul>
            </div>
          </section>

          <section style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <strong>Tech Fokus</strong>
              <span>Smartphones, TVs, Audio, Gaming, Laptops und Zubehör.</span>
            </div>

            <div style={styles.infoCard}>
              <strong>Smart Ranking</strong>
              <span>Deals werden nach Klicks, Frische und Deal-Signal sortiert.</span>
            </div>

            <div style={styles.infoCard}>
              <strong>Transparenz</strong>
              <span>Mit Impressum, Datenschutz und sichtbarem Affiliate-Hinweis.</span>
            </div>
          </section>

          <section style={styles.contentBox}>
            <h2 style={styles.contentTitle}>Technik-Angebote mit klarem Fokus</h2>
            <p>
              Orbital-Noir Deals ist eine kuratierte Deal-Seite für Technik-Produkte.
              Der Fokus liegt auf relevanten Kategorien wie Smartphones, Fernsehern,
              Laptops, Audio, Gaming und Smart-Home-Zubehör.
            </p>
            <p>
              Ziel ist schnelle Orientierung: Nutzer erkennen direkt, welche
              Angebote aktuell interessant sind, welche Produkte beliebt sind und
              wo mögliche Preisfehler oder starke Schnäppchen liegen.
            </p>
          </section>

          <section style={styles.categoryBox}>
            <div style={styles.sectionHead}>
              <div>
                <div style={styles.label}>Kategorien</div>
                <h2 style={styles.sectionTitle}>Deals nach Bereich</h2>
              </div>
              <p style={styles.smallText}>Schnell zu den wichtigsten Technik-Kategorien.</p>
            </div>

            <div style={styles.pills}>
              {CATEGORIES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setCategory(item.value);
                    document
                      .getElementById("alle-deals")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={category === item.value ? styles.pillActive : styles.pill}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section id="top-deals" style={styles.section}>
            <div style={styles.sectionHead}>
              <div>
                <div style={styles.label}>Top Auswahl</div>
                <h2 style={styles.sectionTitle}>Beliebte Tech Deals</h2>
              </div>
              <p style={styles.smallText}>Sortiert nach Deal-Potenzial und Beliebtheit.</p>
            </div>

            {topDeals.length === 0 ? (
              <div style={styles.emptyBox}>Noch keine Deals vorhanden.</div>
            ) : (
              <div style={styles.grid}>
                {topDeals.map((p) => (
                  <DealCard key={p.id} deal={p} onClick={handleDealClick} />
                ))}
              </div>
            )}
          </section>

          <section id="preisfehler" style={styles.section}>
            <div style={styles.sectionHead}>
              <div>
                <div style={styles.label}>Auffällige Angebote</div>
                <h2 style={styles.sectionTitle}>Preisfehler & starke Schnäppchen</h2>
              </div>
              <p style={styles.smallText}>Besonders günstige oder markierte Angebote.</p>
            </div>

            {priceErrors.length === 0 ? (
              <div style={styles.emptyBox}>Aktuell sind keine Preisfehler markiert.</div>
            ) : (
              <div style={styles.grid}>
                {priceErrors.map((p) => (
                  <DealCard key={p.id} deal={p} onClick={handleDealClick} />
                ))}
              </div>
            )}
          </section>

          <section id="alle-deals" style={styles.section}>
            <div style={styles.sectionHead}>
              <div>
                <div style={styles.label}>Alle Angebote</div>
                <h2 style={styles.sectionTitle}>Aktuelle Tech Deals</h2>
              </div>
              <p style={styles.smallText}>{filtered.length} Angebote gefunden</p>
            </div>

            <div style={styles.filterBar}>
              <input
                type="text"
                placeholder="Suche nach Produkt, Marke oder Kategorie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={styles.select}
              >
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.pills}>
              {CATEGORIES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  style={category === item.value ? styles.pillActive : styles.pill}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={styles.emptyBox}>Keine passenden Angebote gefunden.</div>
            ) : (
              <div style={styles.grid}>
                {filtered.map((p) => (
                  <DealCard key={p.id} deal={p} onClick={handleDealClick} />
                ))}
              </div>
            )}
          </section>

          <section style={styles.contentBox}>
            <h2 style={styles.contentTitle}>Affiliate-Transparenz</h2>
            <p>
              Diese Website ist ein unabhängiger Deal-Aggregator für Technik-Produkte.
              Einige Links können Affiliate-Links sein. Wenn ein Kauf über einen
              solchen Link erfolgt, kann Orbital-Noir Deals eine Provision erhalten.
              Für Nutzer entstehen dadurch keine zusätzlichen Kosten.
            </p>
          </section>

          <footer style={styles.footer}>
            <a href="/impressum" style={styles.footerLink}>Impressum</a>
            <span>•</span>
            <a href="/datenschutz" style={styles.footerLink}>Datenschutz</a>
            <span>•</span>
            <a href="/" style={styles.footerLink}>Hauptseite</a>
          </footer>
        </main>
      </div>
    </>
  );
}

const cardBase = {
  background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(255,255,255,0.65)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
};

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #fff7c2 0%, #ffd166 35%, #e76f51 72%, #355070 100%)",
    color: "#111827",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "22px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
  },
  logo: {
    color: "#111827",
    textDecoration: "none",
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: "-0.04em",
  },
  nav: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
  },
  navLink: {
    color: "#111827",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "15px",
  },
  shell: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "8px 16px 50px",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.6fr)",
    gap: "22px",
    ...cardBase,
    borderRadius: "28px",
    padding: "34px",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  label: {
    color: "#6b7280",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 800,
    marginBottom: "12px",
  },
  title: {
    margin: 0,
    maxWidth: "780px",
    fontSize: "clamp(38px, 5vw, 72px)",
    lineHeight: 0.98,
    letterSpacing: "-0.06em",
  },
  text: {
    maxWidth: "720px",
    color: "#4b5563",
    fontSize: "18px",
    lineHeight: 1.7,
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "22px",
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
    fontWeight: 800,
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
    fontWeight: 800,
    border: "1px solid #d1d5db",
  },
  affiliateNote: {
    marginTop: "18px",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  trustBox: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(17,24,39,0.08)",
    borderRadius: "22px",
    padding: "22px",
  },
  trustTitle: {
    marginTop: 0,
    marginBottom: "10px",
    color: "#111827",
  },
  trustList: {
    margin: 0,
    paddingLeft: "20px",
    color: "#374151",
    lineHeight: 1.9,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    marginTop: "22px",
  },
  infoCard: {
    ...cardBase,
    borderRadius: "20px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  contentBox: {
    marginTop: "34px",
    ...cardBase,
    borderRadius: "24px",
    padding: "26px",
    color: "#374151",
    lineHeight: 1.75,
  },
  contentTitle: {
    marginTop: 0,
    color: "#111827",
    letterSpacing: "-0.03em",
  },
  categoryBox: {
    marginTop: "34px",
    ...cardBase,
    borderRadius: "24px",
    padding: "24px",
  },
  section: {
    marginTop: "34px",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "34px",
    letterSpacing: "-0.04em",
  },
  smallText: {
    color: "#374151",
    margin: 0,
  },
  filterBar: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 220px",
    gap: "12px",
    marginBottom: "16px",
  },
  searchInput: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "14px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827",
  },
  select: {
    width: "100%",
    minHeight: "46px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "14px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827",
  },
  pills: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  pill: {
    minHeight: "38px",
    padding: "0 13px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    background: "rgba(255,255,255,0.9)",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 700,
  },
  pillActive: {
    minHeight: "38px",
    padding: "0 13px",
    borderRadius: "999px",
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
  },
  emptyBox: {
    ...cardBase,
    borderRadius: "20px",
    padding: "22px",
    color: "#4b5563",
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "30px",
    color: "#111827",
    flexWrap: "wrap",
  },
  footerLink: {
    color: "#111827",
    textDecoration: "none",
    fontWeight: 700,
  },
};
