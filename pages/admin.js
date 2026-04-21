import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { buildSmartProduct, detectVendor, normalizeUrl } from "../lib/smartImport";
import { importFeedRows, parseFeedText } from "../lib/feedImport";

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active ? styles.tabActive : styles.tab}
    >
      {children}
    </button>
  );
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("manual");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [buyLink, setBuyLink] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [importLink, setImportLink] = useState("");
  const [importTitle, setImportTitle] = useState("");
  const [importPrice, setImportPrice] = useState("");
  const [bulkLinks, setBulkLinks] = useState("");
  const [feedText, setFeedText] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [amazonQuery, setAmazonQuery] = useState("");
  const [amazonLoading, setAmazonLoading] = useState(false);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncRuns, setSyncRuns] = useState([]);

  useEffect(() => {
    if (!supabase) return;

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = "/login";
        return;
      }

      const email = data.session.user?.email || "";
      const isAdmin = email.toLowerCase() === adminEmail.toLowerCase();

      if (!isAdmin) {
        window.location.href = "/";
        return;
      }

      setSession(data.session);
      loadProducts();
      loadSyncRuns(data.session.access_token);
    });
  }, []);

  async function loadProducts() {
    if (!supabase) return;

    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  }

  async function loadSyncRuns(accessToken) {
    if (!accessToken) return;

    try {
      const res = await fetch("/api/admin/sync-runs", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const data = await res.json();
      if (data.ok) setSyncRuns(data.runs || []);
    } catch {
      setSyncRuns([]);
    }
  }

  async function runManualSync() {
    if (!session?.access_token) return;

    setSyncLoading(true);
    setSyncResult(null);
    setMessage("");

    try {
      const res = await fetch("/api/admin/manual-sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();
      setSyncResult(data);

      if (data.ok) {
        setMessage(
          data.skipped
            ? data.reason || "Sync übersprungen."
            : `Sync fertig: ${data.created || 0} neu, ${data.updated || 0} aktualisiert, ${data.skipped || 0} übersprungen.`
        );
        await loadProducts();
        await loadSyncRuns(session.access_token);
      } else {
        setMessage(data.error || "Sync fehlgeschlagen.");
      }
    } catch {
      setMessage("Sync Fehler");
    } finally {
      setSyncLoading(false);
    }
  }

  function handleFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);

    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  function resetManualForm() {
    setEditingId(null);
    setName("");
    setPrice("");
    setDescription("");
    setBuyLink("");
    setFile(null);
    setPreview(null);
  }

  function editProduct(product) {
    setTab("manual");
    setEditingId(product.id);
    setName(product.name || "");
    setPrice(product.price || "");
    setDescription(product.description || "");
    setBuyLink(product.buy_link || "");
    setPreview(product.image || null);
    setFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveManualProduct() {
    if (!supabase || !session?.user) return;

    if (!name || !price) {
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

      imageUrl = supabase.storage.from("images").getPublicUrl(fileName).data.publicUrl;
    }

    const payload = {
      name,
      price,
      description,
      buy_link: normalizeUrl(buyLink)
    };

    if (imageUrl) payload.image = imageUrl;

    if (editingId) {
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
          ...payload,
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

    resetManualForm();
    await loadProducts();
  }

  async function runSmartImport() {
    if (!supabase || !session?.user) return;

    if (!importLink.trim()) {
      setMessage("Bitte mindestens einen Anbieter-Link eingeben.");
      return;
    }

    const built = buildSmartProduct({
      link: importLink,
      title: importTitle,
      price: importPrice
    });

    const product = {
      name: built.name,
      price: built.price,
      description: built.description || "",
      buy_link: built.buy_link,
      image: built.image || null,
      user_id: session.user.id
    };

    const { error } = await supabase.from("products").insert([product]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setImportLink("");
    setImportTitle("");
    setImportPrice("");
    setMessage("Smart Import erfolgreich erstellt.");
    await loadProducts();
  }

  async function runBulkImport() {
    if (!supabase || !session?.user) return;

    const lines = bulkLinks
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      setMessage("Bitte Links Zeile für Zeile einfügen.");
      return;
    }

    const rows = lines.map((link, index) => {
      const built = buildSmartProduct({
        link,
        title: `${detectVendor(link)} Import ${index + 1}`,
        price: "0"
      });

      return {
        name: built.name,
        price: built.price,
        description: built.description || "",
        buy_link: built.buy_link,
        image: built.image || null,
        user_id: session.user.id
      };
    });

    const { error } = await supabase.from("products").insert(rows);

    if (error) {
      setMessage(error.message);
      return;
    }

    setBulkLinks("");
    setMessage(`${rows.length} Produkte automatisch importiert.`);
    await loadProducts();
  }

  async function runFeedImport() {
    if (!supabase || !session?.user) return;

    if (!feedText.trim()) {
      setMessage("Bitte JSON oder CSV einfügen.");
      return;
    }

    let items = [];
    try {
      items = parseFeedText(feedText);
    } catch {
      setMessage("Feed konnte nicht gelesen werden. JSON oder CSV prüfen.");
      return;
    }

    if (!items.length) {
      setMessage("Keine gültigen Feed-Einträge gefunden.");
      return;
    }

    try {
      const result = await importFeedRows({
        supabase,
        items,
        userId: session.user.id
      });

      setFeedText("");
      setMessage(`${result.created} neu, ${result.updated} aktualisiert, ${result.skipped} übersprungen.`);
      await loadProducts();
    } catch (err) {
      setMessage(err.message || "Feed-Import fehlgeschlagen.");
    }
  }

  async function runAmazonImport() {
    if (!supabase || !session?.user) return;

    if (!amazonQuery.trim()) {
      setMessage("Bitte ein Amazon-Suchwort eingeben.");
      return;
    }

    setAmazonLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/amazon-feed?q=${encodeURIComponent(amazonQuery)}`);
      const items = await res.json();

      if (!res.ok) {
        setMessage(items.error || "Amazon-Import fehlgeschlagen.");
        return;
      }

      if (!Array.isArray(items) || !items.length) {
        setMessage("Keine Amazon-Produkte gefunden.");
        return;
      }

      const result = await importFeedRows({
        supabase,
        items,
        userId: session.user.id
      });

      setMessage(
        `Amazon Import fertig: ${result.created} neu, ${result.updated} aktualisiert, ${result.skipped} übersprungen.`
      );

      await loadProducts();
    } catch {
      setMessage("Amazon-Import fehlgeschlagen.");
    } finally {
      setAmazonLoading(false);
    }
  }

  async function deleteProduct(product) {
    if (!supabase) return;
    if (!window.confirm("Dieses Produkt wirklich löschen?")) return;

    if (product.image && product.image.includes("/images/")) {
      const path = product.image.split("/images/")[1];
      if (path) {
        await supabase.storage.from("images").remove([path]);
      }
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Produkt gelöscht.");
    await loadProducts();
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) =>
      [p.name, p.description, p.buy_link, String(p.price)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [products, search]);

  const totalClicks = useMemo(() => {
    return products.reduce((sum, product) => sum + Number(product.clicks || 0), 0);
  }, [products]);

  if (!supabase) {
    return (
      <div style={styles.missingWrap}>
        <h1 style={styles.missingTitle}>Supabase ENV fehlt</h1>
        <p style={styles.missingText}>
          Prüfe NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.
        </p>
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
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.subtitle}>
              Produkte verwalten, Importe ausführen und Sync-Historie prüfen.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              type="button"
              onClick={runManualSync}
              disabled={syncLoading}
              style={styles.primaryButton}
            >
              {syncLoading ? "Sync läuft..." : "Sync starten"}
            </button>

            <a href="/" style={styles.secondaryButton}>
              Zum Shop
            </a>
          </div>
        </header>

        <section style={styles.statsGrid}>
          <StatCard label="Produkte" value={products.length} />
          <StatCard label="Sync Runs" value={syncRuns.length} />
          <StatCard label="Gesamtklicks" value={totalClicks} />
        </section>

        <section style={styles.mainGrid}>
          <div style={styles.leftColumn}>
            <section style={styles.panel}>
              <div style={styles.tabs}>
                <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>
                  Manuell
                </TabButton>
                <TabButton active={tab === "import"} onClick={() => setTab("import")}>
                  Smart Import
                </TabButton>
                <TabButton active={tab === "bulk"} onClick={() => setTab("bulk")}>
                  Bulk
                </TabButton>
                <TabButton active={tab === "feed"} onClick={() => setTab("feed")}>
                  Feed
                </TabButton>
                <TabButton active={tab === "amazon"} onClick={() => setTab("amazon")}>
                  Amazon
                </TabButton>
              </div>

              {tab === "manual" && (
                <>
                  <div style={styles.eyebrow}>{editingId ? "Bearbeiten" : "Neues Produkt"}</div>
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
                  <textarea
                    style={styles.textarea}
                    placeholder="Beschreibung"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <input
                    style={styles.input}
                    placeholder="Verkaufslink / Kauf-URL"
                    value={buyLink}
                    onChange={(e) => setBuyLink(e.target.value)}
                  />
                  <input style={styles.input} type="file" onChange={handleFile} />

                  {preview ? (
                    <div style={styles.previewBox}>
                      <img src={preview} alt="Vorschau" style={styles.previewImage} />
                    </div>
                  ) : null}

                  <div style={styles.formActions}>
                    <button type="button" onClick={saveManualProduct} style={styles.primaryButton}>
                      {editingId ? "Änderungen speichern" : "Produkt erstellen"}
                    </button>

                    {editingId ? (
                      <button
                        type="button"
                        onClick={resetManualForm}
                        style={styles.secondaryButton}
                      >
                        Abbrechen
                      </button>
                    ) : null}
                  </div>
                </>
              )}

              {tab === "import" && (
                <>
                  <div style={styles.eyebrow}>Einzel-Link Import</div>
                  <h2 style={styles.sectionTitle}>Smart Import</h2>

                  <input
                    style={styles.input}
                    placeholder="Anbieter-Link"
                    value={importLink}
                    onChange={(e) => setImportLink(e.target.value)}
                  />
                  <input
                    style={styles.input}
                    placeholder="Optionaler Produkttitel"
                    value={importTitle}
                    onChange={(e) => setImportTitle(e.target.value)}
                  />
                  <input
                    style={styles.input}
                    placeholder="Optionaler Preis"
                    value={importPrice}
                    onChange={(e) => setImportPrice(e.target.value)}
                  />

                  <button type="button" onClick={runSmartImport} style={styles.primaryButton}>
                    Smart Import ausführen
                  </button>
                </>
              )}

              {tab === "bulk" && (
                <>
                  <div style={styles.eyebrow}>Mehrere Links</div>
                  <h2 style={styles.sectionTitle}>Bulk Import</h2>

                  <textarea
                    style={styles.textarea}
                    placeholder={"https://amazon.de/...\nhttps://otto.de/..."}
                    value={bulkLinks}
                    onChange={(e) => setBulkLinks(e.target.value)}
                  />

                  <button type="button" onClick={runBulkImport} style={styles.primaryButton}>
                    Bulk Import starten
                  </button>
                </>
              )}

              {tab === "feed" && (
                <>
                  <div style={styles.eyebrow}>CSV oder JSON</div>
                  <h2 style={styles.sectionTitle}>Feed Import</h2>

                  <textarea
                    style={styles.textareaLarge}
                    placeholder={
                      'JSON Beispiel:\n[{"name":"Produkt A","price":"199","buy_link":"https://amazon.de/...","image":"https://..."}]\n\nCSV Beispiel:\nname,price,buy_link,image,description\nProdukt A,199,https://amazon.de/...,https://...,Top Deal'
                    }
                    value={feedText}
                    onChange={(e) => setFeedText(e.target.value)}
                  />

                  <button type="button" onClick={runFeedImport} style={styles.primaryButton}>
                    Feed importieren
                  </button>
                </>
              )}

              {tab === "amazon" && (
                <>
                  <div style={styles.eyebrow}>Amazon API</div>
                  <h2 style={styles.sectionTitle}>Amazon Import</h2>

                  <input
                    style={styles.input}
                    placeholder="z. B. Monitor, Kopfhörer, Gaming Maus"
                    value={amazonQuery}
                    onChange={(e) => setAmazonQuery(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={runAmazonImport}
                    disabled={amazonLoading}
                    style={styles.primaryButton}
                  >
                    {amazonLoading ? "Amazon lädt..." : "Amazon Produkte importieren"}
                  </button>
                </>
              )}

              {message ? <div style={styles.messageBox}>{message}</div> : null}
            </section>

            <section style={styles.panel}>
              <div style={styles.eyebrow}>Sync Historie</div>
              <h2 style={styles.sectionTitle}>Letzte Läufe</h2>

              {syncResult ? (
                <div style={styles.codeBox}>
                  <pre style={styles.pre}>{JSON.stringify(syncResult, null, 2)}</pre>
                </div>
              ) : null}

              {syncRuns.length === 0 ? (
                <p style={styles.muted}>Noch keine Sync-Historie vorhanden.</p>
              ) : (
                <div style={styles.syncList}>
                  {syncRuns.map((run) => (
                    <div key={run.id} style={styles.syncItem}>
                      <strong style={styles.syncName}>{run.source_name || "default"}</strong>
                      <div style={styles.syncMeta}>Items: {run.item_count ?? 0}</div>
                      <div style={styles.syncMeta}>
                        {new Date(run.created_at).toLocaleString("de-DE")}
                      </div>
                      <div style={styles.syncKey}>{run.run_key}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section style={styles.panel}>
            <div style={styles.listHeader}>
              <div>
                <div style={styles.eyebrow}>Produkte</div>
                <h2 style={styles.sectionTitle}>Archiv</h2>
              </div>

              <input
                style={styles.searchInput}
                placeholder="Suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div style={styles.emptyState}>Keine Produkte gefunden.</div>
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
                            {product.clicks || 0} Klicks
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

                      <div style={styles.productActions}>
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
    maxWidth: "1320px",
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

  eyebrow: {
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#6b7280",
    marginBottom: "8px"
  },

  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
    color: "#111827"
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    color: "#4b5563",
    lineHeight: 1.6
  },

  headerActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "18px"
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px"
  },

  statValue: {
    fontSize: "30px",
    fontWeight: 700,
    letterSpacing: "-0.04em",
    color: "#111827"
  },

  statLabel: {
    marginTop: "8px",
    color: "#6b7280"
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.15fr",
    gap: "18px",
    alignItems: "start"
  },

  leftColumn: {
    display: "grid",
    gap: "18px"
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px"
  },

  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "18px"
  },

  tab: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    cursor: "pointer",
    color: "#111827",
    fontWeight: 500
  },

  tabActive: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #111827",
    background: "#111827",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "14px",
    fontSize: "24px",
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
    color: "#111827"
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

  textareaLarge: {
    width: "100%",
    minHeight: "220px",
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

  formActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
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

  messageBox: {
    marginTop: "14px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #e5e7eb"
  },

  codeBox: {
    marginBottom: "16px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    overflowX: "auto"
  },

  pre: {
    margin: 0,
    whiteSpace: "pre-wrap",
    color: "#111827",
    fontSize: "13px",
    lineHeight: 1.5
  },

  muted: {
    color: "#6b7280",
    margin: 0
  },

  syncList: {
    display: "grid",
    gap: "12px"
  },

  syncItem: {
    padding: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    background: "#f9fafb"
  },

  syncName: {
    color: "#111827"
  },

  syncMeta: {
    marginTop: "6px",
    color: "#4b5563",
    fontSize: "14px"
  },

  syncKey: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#6b7280",
    wordBreak: "break-word"
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "14px"
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

  productActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },

  emptyState: {
    padding: "24px",
    borderRadius: "14px",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    color: "#6b7280"
  },

  missingWrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "40px",
    background: "#f6f7f9",
    color: "#111827",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },

  missingTitle: {
    marginTop: 0,
    marginBottom: "10px",
    fontSize: "32px",
    color: "#111827"
  },

  missingText: {
    margin: 0,
    color: "#4b5563",
    lineHeight: 1.6
  }
};
