import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const CATEGORY_OPTIONS = [
  { value: "tv", label: "TV" },
  { value: "smartphone", label: "Smartphones" },
  { value: "audio", label: "Audio" },
  { value: "laptop", label: "Laptops" },
  { value: "monitor", label: "Monitore" },
  { value: "pc", label: "PC Zubehör" },
  { value: "gaming", label: "Gaming" },
  { value: "smarthome", label: "Smart Home" },
  { value: "network", label: "Netzwerk" },
  { value: "storage", label: "Storage" },
  { value: "office", label: "Office" },
  { value: "wearable", label: "Wearables" },
  { value: "camera", label: "Kamera" }
];

function getCategoryLabel(value) {
  return CATEGORY_OPTIONS.find((item) => item.value === value)?.label || "Ohne Kategorie";
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [buyLink, setBuyLink] = useState("");
  const [category, setCategory] = useState("tv");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncData, setSyncData] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = "/login?redirect=/admin";
        return;
      }

      setSession(data.session);
      await loadProducts();
    });
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setProducts(data || []);
  }

  function handleFile(e) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);

    if (selected) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setPrice("");
    setDescription("");
    setBuyLink("");
    setCategory("tv");
    setFile(null);
    setPreview(null);
  }

  function editProduct(product) {
    setEditingId(product.id);
    setName(product.name || "");
    setPrice(String(product.price || ""));
    setDescription(product.description || "");
    setBuyLink(product.buy_link || "");
    setCategory(product.category || "tv");
    setPreview(product.image || null);
    setFile(null);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct() {
    if (!session?.user) return;

    if (!name.trim() || !price.trim()) {
      setMessage("Bitte Name und Preis ausfüllen.");
      return;
    }

    let imageUrl = null;

    if (file) {
      const fileName = `${Date.now()}-${file.name}`;
      const upload = await supabase.storage.from("images").upload(fileName, file);

      if (upload.error) {
        setMessage(upload.error.message);
        return;
      }

      const publicUrl = supabase.storage.from("images").getPublicUrl(fileName);
      imageUrl = publicUrl.data.publicUrl;
    }

    if (editingId) {
      const payload = {
        name,
        price,
        description,
        buy_link: buyLink,
        category
      };

      if (imageUrl) payload.image = imageUrl;

      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Produkt aktualisiert.");
    } else {
      const { error } = await supabase.from("products").insert([
        {
          name,
          price,
          description,
          buy_link: buyLink,
          category,
          image: imageUrl,
          user_id: session.user.id
        }
      ]);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Produkt erstellt.");
    }

    resetForm();
    await loadProducts();
  }

  async function deleteProduct(product) {
    const ok = window.confirm("Dieses Produkt wirklich löschen?");
    if (!ok) return;

    const { error } = await supabase.from("products").delete().eq("id", product.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Produkt gelöscht.");
    await loadProducts();
  }

  async function runManualSync() {
    setSyncLoading(true);
    setSyncData(null);
    setMessage("");

    try {
      const res = await fetch("/api/cron/import-amazon");
      const data = await res.json();

      setSyncData(data);

      if (data?.ok) {
        setMessage(
          `Sync fertig: ${data.created || 0} neu, ${data.updated || 0} aktualisiert, ${data.skipped || 0} übersprungen.`
        );
        await loadProducts();
      } else {
        setMessage(data?.error || "Sync fehlgeschlagen.");
      }
    } catch {
      setSyncData({ ok: false, error: "Fehler beim Sync" });
      setMessage("Fehler beim Sync.");
    } finally {
      setSyncLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((p) => {
      const matchesSearch =
        !q ||
        [p.name, p.description, p.buy_link, p.category, String(p.price)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === "all" ||
        String(p.category || "").toLowerCase() === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  if (!supabase) {
    return (
      <div style={styles.centerWrap}>
        <h1 style={styles.title}>Supabase fehlt</h1>
        <p style={styles.text}>Prüfe deine ENV Variablen für Supabase.</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={styles.page}>
      <main style={styles.shell}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Orbital-Noir / Admin</div>
            <h1 style={styles.mainTitle}>Admin</h1>
            <p style={styles.text}>
              Produkte anlegen, kategorisieren, bearbeiten und den Import manuell starten.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button type="button" onClick={runManualSync} style={styles.primaryButton} disabled={syncLoading}>
              {syncLoading ? "Sync läuft..." : "Amazon Cron ausführen"}
            </button>

            <a href="/" style={styles.secondaryButton}>
              Zum Shop
            </a>
          </div>
        </header>

        {message ? <div style={styles.message}>{message}</div> : null}

        {syncData ? (
          <div style={styles.syncBox}>
            <pre style={styles.pre}>{JSON.stringify(syncData, null, 2)}</pre>
          </div>
        ) : null}

        <section style={styles.grid}>
          <section style={styles.panel}>
            <div style={styles.eyebrow}>
              {editingId ? "Bearbeiten" : "Neues Produkt"}
            </div>
            <h2 style={styles.sectionTitle}>
              {editingId ? "Produkt aktualisieren" : "Produkt anlegen"}
            </h2>

            <input
              style={styles.input}
              placeholder="Produktname"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Preis"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <select
              style={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <textarea
              style={styles.textarea}
              placeholder="Beschreibung"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Kauf-Link"
              value={buyLink}
              onChange={(e) => setBuyLink(e.target.value)}
            />

            <input style={styles.input} type="file" onChange={handleFile} />

            {preview ? (
              <div style={styles.previewBox}>
                <img src={preview} alt="Vorschau" style={styles.previewImage} />
              </div>
            ) : null}

            <div style={styles.actions}>
              <button type="button" onClick={saveProduct} style={styles.primaryButton}>
                {editingId ? "Speichern" : "Erstellen"}
              </button>

              {editingId ? (
                <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                  Abbrechen
                </button>
              ) : null}
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.listHeader}>
              <div>
                <div style={styles.eyebrow}>Produkte</div>
                <h2 style={styles.sectionTitle}>Liste</h2>
              </div>

              <div style={styles.filters}>
                <input
                  style={styles.searchInput}
                  placeholder="Suchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  style={styles.filterSelect}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">Alle Kategorien</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div style={styles.empty}>Keine Produkte gefunden.</div>
            ) : (
              <div style={styles.productList}>
                {filteredProducts.map((product) => (
                  <article key={product.id} style={styles.productCard}>
                    <img
                      src={product.image || "https://via.placeholder.com/800x600?text=Produkt"}
                      alt={product.name}
                      style={styles.productImage}
                    />

                    <div style={styles.productContent}>
                      <div style={styles.productTop}>
                        <div>
                          <h3 style={styles.productTitle}>{product.name}</h3>
                          <div style={styles.productMeta}>
                            {getCategoryLabel(product.category)} · {product.clicks || 0} Klicks
                          </div>
                        </div>

                        <strong style={styles.productPrice}>{product.price} €</strong>
                      </div>

                      <p style={styles.productDescription}>
                        {product.description || "Keine Beschreibung hinterlegt."}
                      </p>

                      {product.buy_link ? (
                        <div style={styles.productLink}>{product.buy_link}</div>
                      ) : null}

                      <div style={styles.actions}>
                        <button
                          type="button"
                          onClick={() => editProduct(product)}
                          style={styles.secondaryButton}
                        >
                          Bearbeiten
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteProduct(product)}
                          style={styles.dangerButton}
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7f9",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#111827"
  },

  shell: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "28px 16px 40px"
  },

  header: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "18px"
  },

  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: "18px",
    alignItems: "start"
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px"
  },

  eyebrow: {
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#6b7280",
    marginBottom: "8px"
  },

  mainTitle: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.05,
    letterSpacing: "-0.04em"
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "14px",
    fontSize: "24px",
    lineHeight: 1.1,
    letterSpacing: "-0.03em"
  },

  title: {
    marginTop: 0,
    marginBottom: "10px",
    fontSize: "32px"
  },

  text: {
    margin: 0,
    color: "#4b5563",
    lineHeight: 1.6
  },

  input: {
    width: "100%",
    marginBottom: "12px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827"
  },

  select: {
    width: "100%",
    marginBottom: "12px",
    minHeight: "46px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827"
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    marginBottom: "12px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    boxSizing: "border-box",
    resize: "vertical",
    background: "#ffffff",
    color: "#111827"
  },

  primaryButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "44px",
    padding: "0 16px",
    borderRadius: "12px",
    background: "#111827",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    fontWeight: 600
  },

  secondaryButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "44px",
    padding: "0 16px",
    borderRadius: "12px",
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #d1d5db",
    cursor: "pointer",
    textDecoration: "none",
    fontWeight: 600
  },

  dangerButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "44px",
    padding: "0 16px",
    borderRadius: "12px",
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    cursor: "pointer",
    textDecoration: "none",
    fontWeight: 600
  },

  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },

  previewBox: {
    marginBottom: "14px",
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    background: "#f9fafb"
  },

  previewImage: {
    display: "block",
    width: "100%",
    maxHeight: "260px",
    objectFit: "cover"
  },

  message: {
    marginBottom: "14px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #e5e7eb"
  },

  syncBox: {
    marginBottom: "18px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
    overflowX: "auto"
  },

  pre: {
    margin: 0,
    whiteSpace: "pre-wrap",
    color: "#111827",
    fontSize: "13px",
    lineHeight: 1.5
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "14px"
  },

  filters: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },

  searchInput: {
    width: "260px",
    maxWidth: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827"
  },

  filterSelect: {
    minHeight: "46px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827"
  },

  productList: {
    display: "grid",
    gap: "14px"
  },

  productCard: {
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: "16px",
    padding: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    background: "#fafafa",
    alignItems: "start"
  },

  productImage: {
    width: "100%",
    height: "140px",
    objectFit: "cover",
    borderRadius: "12px",
    background: "#f3f4f6"
  },

  productContent: {
    minWidth: 0
  },

  productTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "start",
    marginBottom: "8px",
    flexWrap: "wrap"
  },

  productTitle: {
    margin: 0,
    fontSize: "20px",
    lineHeight: 1.2,
    letterSpacing: "-0.03em",
    color: "#111827"
  },

  productMeta: {
    marginTop: "6px",
    color: "#6b7280",
    fontSize: "14px"
  },

  productPrice: {
    color: "#111827",
    whiteSpace: "nowrap",
    fontSize: "18px"
  },

  productDescription: {
    marginTop: 0,
    marginBottom: "10px",
    color: "#4b5563",
    lineHeight: 1.6
  },

  productLink: {
    marginBottom: "12px",
    color: "#374151",
    fontSize: "13px",
    wordBreak: "break-all"
  },

  empty: {
    padding: "24px",
    borderRadius: "14px",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    color: "#6b7280"
  },

  centerWrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "40px",
    background: "#f6f7f9",
    color: "#111827",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }
};
