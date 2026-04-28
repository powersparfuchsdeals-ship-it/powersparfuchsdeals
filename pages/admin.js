import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import AdminImport from "../components/AdminImport";

const EMPTY_PRODUCT = {
  name: "",
  price: "",
  category: "",
  image: "",
  buy_link: "",
  description: "",
  tag: "",
  merchant: "",
  old_price: "",
  commission_rate: "0.03",
};

function formatPrice(value) {
  const n = Number(value || 0);
  return `${n.toFixed(2)} €`;
}

function getRevenue(product) {
  const price = Number(product.price || 0);
  const clicks = Number(product.clicks || 0);
  const commissionRate = Number(product.commission_rate || 0.03);
  return price * clicks * commissionRate;
}

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);

  const [products, setProducts] = useState([]);
  const [trackingEvents, setTrackingEvents] = useState([]);

  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [createMsg, setCreateMsg] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [importMessage, setImportMessage] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error(error);
        setIsReady(true);
        setIsAllowed(false);
        return;
      }

      const nextSession = data.session ?? null;
      setSession(nextSession);

      if (!nextSession) {
        window.location.href = "/login";
        return;
      }

      const userEmail = (nextSession.user?.email || "").toLowerCase();
      const allowed = !!adminEmail && userEmail === adminEmail;

      setIsAllowed(allowed);
      setIsReady(true);

      if (!allowed) {
        window.location.href = "/";
        return;
      }

      await Promise.all([loadProducts(), loadTracking()]);
    }

    boot();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession ?? null);

        if (!nextSession) {
          setIsAllowed(false);
          setIsReady(true);
          window.location.href = "/login";
          return;
        }

        const userEmail = (nextSession.user?.email || "").toLowerCase();
        const allowed = !!adminEmail && userEmail === adminEmail;

        setIsAllowed(allowed);
        setIsReady(true);

        if (!allowed) {
          window.location.href = "/";
          return;
        }

        await Promise.all([loadProducts(), loadTracking()]);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [adminEmail]);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load products error:", error);
      return;
    }

    setProducts(data || []);
  }

  async function loadTracking() {
    const { data, error } = await supabase
      .from("tracking_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      console.error("Load tracking error:", error);
      setTrackingEvents([]);
      return;
    }

    setTrackingEvents(data || []);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function runImport(url) {
    setImportLoading(true);
    setImportMessage("Import läuft...");

    try {
      const res = await fetch(url, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        setImportMessage(`❌ Fehler: ${data?.error || "Import fehlgeschlagen"}`);
        return;
      }

      setImportMessage(
        `✅ Fertig: ${data.created || 0} neu, ${
          data.updated || 0
        } aktualisiert, ${data.skipped || 0} übersprungen.`
      );

      await Promise.all([loadProducts(), loadTracking()]);
    } catch (error) {
      console.error("Import error:", error);
      setImportMessage("❌ Import fehlgeschlagen.");
    } finally {
      setImportLoading(false);
    }
  }

  async function createProduct() {
    if (createLoading) return;

    if (!newProduct.name.trim() || !newProduct.price || !newProduct.buy_link.trim()) {
      setCreateMsg("❌ Name, Preis und Affiliate / Buy Link sind erforderlich.");
      return;
    }

    setCreateLoading(true);
    setCreateMsg("Produkt wird erstellt...");

    try {
  const res = await fetch("/api/admin-create-product", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newProduct),
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    setCreateMsg("❌ Fehler: " + (data.error || "Unbekannt"));
    console.error(data);
    return;
  }

  setCreateMsg("✅ Produkt wurde erstellt.");
  setNewProduct({ ...EMPTY_PRODUCT });

  await loadProducts();
} catch (err) {
  console.error(err);
  setCreateMsg("❌ Fehler: " + err.message);
} finally {
  setCreateLoading(false);
}

      const { error } = await supabase.from("products").insert([payload]);

      if (error) {
        console.error("Supabase insert error:", error);
        setCreateMsg(`❌ Fehler: ${error.message}`);
        return;
      }

      setCreateMsg("✅ Produkt wurde erstellt.");
      setNewProduct({ ...EMPTY_PRODUCT });
      await Promise.all([loadProducts(), loadTracking()]);
    } catch (error) {
      console.error("Create product error:", error);
      setCreateMsg("❌ Produkt konnte nicht erstellt werden. Siehe Browser-Konsole.");
    } finally {
      setCreateLoading(false);
    }
  }

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalDbClicks = products.reduce(
      (sum, p) => sum + Number(p.clicks || 0),
      0
    );
    const totalTrackingClicks = trackingEvents.filter(
      (e) => e.type === "click"
    ).length;
    const estimatedRevenue = products.reduce(
      (sum, p) => sum + getRevenue(p),
      0
    );

    return {
      totalProducts,
      totalDbClicks,
      totalTrackingClicks,
      estimatedRevenue,
    };
  }, [products, trackingEvents]);

  const topProducts = useMemo(() => {
    return [...products]
      .map((p) => ({
        ...p,
        estimatedRevenue: getRevenue(p),
      }))
      .sort((a, b) => Number(b.clicks || 0) - Number(a.clicks || 0))
      .slice(0, 12);
  }, [products]);

  if (!isReady) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>Admin Dashboard wird geladen…</div>
      </div>
    );
  }

  if (!session || !isAllowed) return null;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <a href="/" style={styles.logo}>
          Orbital-Noir Admin
        </a>

        <nav style={styles.nav}>
          <a href="/" style={styles.link}>
            Shop
          </a>
          <a href="/deals" style={styles.link}>
            Deals
          </a>
          <button type="button" onClick={logout} style={styles.logout}>
            Logout
          </button>
        </nav>
      </header>

      <main style={styles.shell}>
        <section style={styles.hero}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.text}>
            Produkte, Imports, Tracking und manuelle Angebote.
          </p>
        </section>

        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Produkte</div>
            <div style={styles.statValue}>{stats.totalProducts}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>DB Klicks</div>
            <div style={styles.statValue}>{stats.totalDbClicks}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Tracking Klicks</div>
            <div style={styles.statValue}>{stats.totalTrackingClicks}</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Geschätzt gesamt</div>
            <div style={styles.statValue}>
              {formatPrice(stats.estimatedRevenue)}
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.micro}>Imports</div>
              <h2 style={styles.sectionTitle}>Cron & Import Aktionen</h2>
            </div>
          </div>

          <div style={styles.quickGrid}>
            <button
              type="button"
              onClick={() => runImport("/api/cron/import-amazon")}
              disabled={importLoading}
              style={styles.button}
            >
              Amazon Import starten
            </button>

            <button
              type="button"
              onClick={() => runImport("/api/admin/import-preisfehler")}
              disabled={importLoading}
              style={styles.button}
            >
              Preisfehler Import starten
            </button>

            <button
              type="button"
              onClick={() => runImport("/api/admin/import-featured")}
              disabled={importLoading}
              style={styles.button}
            >
              Featured Import starten
            </button>

            <button
              type="button"
              onClick={() => runImport("/api/admin/import-otto-awin")}
              disabled={importLoading}
              style={styles.button}
            >
              OTTO / Awin Import starten
            </button>
          </div>

          {importMessage ? <div style={styles.message}>{importMessage}</div> : null}

          <div style={styles.importBox}>
            <AdminImport />
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.micro}>Manuell</div>
              <h2 style={styles.sectionTitle}>Produkt hinzufügen</h2>
            </div>
          </div>

          <div style={styles.formGrid}>
            <input
              placeholder="Produktname"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              style={styles.input}
            />

            <input
              placeholder="Preis (€)"
              type="number"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
              style={styles.input}
            />

            <input
              placeholder="Alter Preis (€)"
              type="number"
              value={newProduct.old_price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, old_price: e.target.value })
              }
              style={styles.input}
            />

            <input
              placeholder="Händler z.B. OTTO / Amazon"
              value={newProduct.merchant}
              onChange={(e) =>
                setNewProduct({ ...newProduct, merchant: e.target.value })
              }
              style={styles.input}
            />

            <input
              placeholder="Provision z.B. 0.03"
              type="number"
              step="0.01"
              value={newProduct.commission_rate}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  commission_rate: e.target.value,
                })
              }
              style={styles.input}
            />

            <input
              placeholder="Kategorie z.B. smartphone"
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
              style={styles.input}
            />

            <input
              placeholder="Bild URL"
              value={newProduct.image}
              onChange={(e) =>
                setNewProduct({ ...newProduct, image: e.target.value })
              }
              style={styles.input}
            />

            <input
              placeholder="Affiliate / Buy Link"
              value={newProduct.buy_link}
              onChange={(e) =>
                setNewProduct({ ...newProduct, buy_link: e.target.value })
              }
              style={styles.input}
            />

            <input
              placeholder="Tag z.B. featured / preisfehler"
              value={newProduct.tag}
              onChange={(e) =>
                setNewProduct({ ...newProduct, tag: e.target.value })
              }
              style={styles.input}
            />

            <textarea
              placeholder="Beschreibung"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
              style={styles.textarea}
            />
          </div>

          <button
            type="button"
            onClick={createProduct}
            disabled={createLoading}
            style={styles.button}
          >
            {createLoading ? "Wird erstellt..." : "➕ Produkt erstellen"}
          </button>

          {createMsg ? <div style={styles.message}>{createMsg}</div> : null}
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.micro}>Produkte</div>
              <h2 style={styles.sectionTitle}>Top Produkte</h2>
            </div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produkt</th>
                  <th style={styles.th}>Händler</th>
                  <th style={styles.th}>Preis</th>
                  <th style={styles.th}>Klicks</th>
                  <th style={styles.th}>Einnahmen</th>
                </tr>
              </thead>

              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.td}>{product.name}</td>
                    <td style={styles.td}>
                      {product.merchant || product.source || "-"}
                    </td>
                    <td style={styles.td}>{formatPrice(product.price)}</td>
                    <td style={styles.td}>{Number(product.clicks || 0)}</td>
                    <td style={styles.tdStrong}>
                      {formatPrice(product.estimatedRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #fff7c2 0%, #ffd166 35%, #e76f51 72%, #355070 100%)",
    color: "#111827",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    paddingBottom: 48,
  },
  header: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "22px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
  },
  logo: {
    color: "#111827",
    textDecoration: "none",
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: "-0.04em",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
  },
  link: {
    color: "#111827",
    textDecoration: "none",
    fontWeight: 700,
  },
  logout: {
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  shell: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "0 16px",
  },
  hero: {
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(255,255,255,0.65)",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
    marginBottom: 22,
  },
  title: {
    margin: 0,
    fontSize: "clamp(38px, 5vw, 72px)",
    lineHeight: 0.98,
    letterSpacing: "-0.06em",
  },
  text: {
    color: "#4b5563",
    fontSize: 18,
    lineHeight: 1.7,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 22,
  },
  statCard: {
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(255,255,255,0.65)",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
  },
  statLabel: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 8,
    fontWeight: 700,
  },
  statValue: {
    color: "#111827",
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  card: {
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(255,255,255,0.65)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
    marginBottom: 22,
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  micro: {
    color: "#6b7280",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 800,
    marginBottom: 8,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 32,
    letterSpacing: "-0.04em",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  button: {
    minHeight: 46,
    borderRadius: 12,
    border: "1px solid rgba(17,24,39,0.12)",
    background: "#111827",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    padding: "0 14px",
  },
  message: {
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    color: "#111827",
  },
  importBox: {
    marginTop: 22,
    paddingTop: 18,
    borderTop: "1px solid #e5e7eb",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    color: "#111827",
    background: "#ffffff",
  },
  textarea: {
    gridColumn: "1 / -1",
    minHeight: 88,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: "10px 12px",
    color: "#111827",
    background: "#ffffff",
    resize: "vertical",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 800,
  },
  td: {
    padding: "14px 10px",
    borderBottom: "1px solid #f3f4f6",
    color: "#374151",
    fontSize: 14,
    verticalAlign: "top",
  },
  tdStrong: {
    padding: "14px 10px",
    borderBottom: "1px solid #f3f4f6",
    color: "#111827",
    fontSize: 14,
    fontWeight: 800,
    verticalAlign: "top",
  },
};
