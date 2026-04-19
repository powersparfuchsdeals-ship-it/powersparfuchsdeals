import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { buildSmartProduct, detectVendor, normalizeUrl } from "../lib/smartImport";
import { importFeedRows, parseFeedText } from "../lib/feedImport";

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
  const [theme, setTheme] = useState("dark");
  
  const [importLink, setImportLink] = useState("");
  const [importTitle, setImportTitle] = useState("");
  const [importPrice, setImportPrice] = useState("");
  const [bulkLinks, setBulkLinks] = useState("");
  const [feedText, setFeedText] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncRuns, setSyncRuns] = useState([]);

  useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (!data.session) {
      window.location.href = "/login";
      return;
    }

    setSession(data.session);
    loadProducts();
    loadSyncRuns(data.session.access_token);
  });
}, []);

useEffect(() => {
  const saved = localStorage.getItem("admin-theme");
  if (saved) setTheme(saved);
}, []);

useEffect(() => {
  document.body.classList.remove("dark", "blue", "green");
  document.body.classList.add(theme);
  localStorage.setItem("admin-theme", theme);
}, [theme]);
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = "/login";
        return;
      }

      setSession(data.session);
      loadProducts();
      loadSyncRuns(data.session.access_token);
    });
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  }

  async function loadSyncRuns(accessToken) {
    if (!accessToken) return;

    const res = await fetch("/api/admin/sync-runs", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const data = await res.json();

    if (data.ok) {
      setSyncRuns(data.runs || []);
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
    } catch (err) {
      setMessage("Sync fehlgeschlagen.");
    } finally {
      setSyncLoading(false);
    }
  }

  function handleFile(e) {
    const nextFile = e.target.files?.[0] || null;
    setFile(nextFile);
    if (nextFile) setPreview(URL.createObjectURL(nextFile));
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
    if (!session?.user) return;

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

      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const payload = {
      name,
      price,
      description,
      buy_link: normalizeUrl(buyLink)
    };

    if (imageUrl) payload.image = imageUrl;

    if (editingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) return setMessage(error.message);
      setMessage("Produkt aktualisiert.");
    } else {
      const { error } = await supabase.from("products").insert([
        {
          ...payload,
          image: imageUrl,
          user_id: session.user.id
        }
      ]);
      if (error) return setMessage(error.message);
      setMessage("Produkt erstellt.");
    }

    resetManualForm();
    await loadProducts();
  }

  async function runSmartImport() {
    if (!session?.user) return;
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
    if (error) return setMessage(error.message);

    setImportLink("");
    setImportTitle("");
    setImportPrice("");
    setMessage("Smart Import erfolgreich erstellt.");
    await loadProducts();
  }

  async function runBulkImport() {
    if (!session?.user) return;

    const lines = bulkLinks.split("\n").map((line) => line.trim()).filter(Boolean);
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
    if (error) return setMessage(error.message);

    setBulkLinks("");
    setMessage(`${rows.length} Produkte automatisch importiert.`);
    await loadProducts();
  }

  async function runFeedImport() {
    if (!session?.user) return;
    if (!feedText.trim()) {
      setMessage("Bitte JSON oder CSV einfügen.");
      return;
    }

    let items = [];
    try {
      items = parseFeedText(feedText);
    } catch (err) {
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

  async function deleteProduct(product) {
    if (!window.confirm("Dieses Produkt wirklich löschen?")) return;

    if (product.image && product.image.includes("/images/")) {
      const path = product.image.split("/images/")[1];
      if (path) {
        await supabase.storage.from("images").remove([path]);
      }
    }

    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) return setMessage(error.message);

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

  if (!session) return null;

  return (
    <div className="admin-wrap-v2 admin-wrap-v3">
      <div className="backdrop-grid" />
      <div className="backdrop-glow glow-a" />
      <div className="backdrop-glow glow-b" />
      <div className="admin-top-actions-v2 admin-top-actions-v3">
  <div className="theme-switcher-v3">
    <button
      className={`cta-secondary cta-large ${theme === "dark" ? "theme-active-v3" : ""}`}
      onClick={() => setTheme("dark")}
      type="button"
    >
      Schwarz
    </button>
    <button
      className={`cta-secondary cta-large ${theme === "blue" ? "theme-active-v3" : ""}`}
      onClick={() => setTheme("blue")}
      type="button"
    >
      Blau
    </button>
    <button
      className={`cta-secondary cta-large ${theme === "green" ? "theme-active-v3" : ""}`}
      onClick={() => setTheme("green")}
      type="button"
    >
      Grün
    </button>
  </div>

  <button
    className="cta-primary cta-large"
    onClick={runManualSync}
    disabled={syncLoading}
    type="button"
  >
    {syncLoading ? "Sync läuft..." : "Sync jetzt starten"}
  </button>

  <a className="cta-secondary cta-large" href="/">
    Zum Shop
  </a>
</div>
      <div className="shell admin-shell-v2 admin-shell-v3">
        <section className="admin-header-v2 panel-v2 panel-v3">
          <div>
            <div className="eyebrow">Orbital-Noir / Feed Import</div>
            <h1>Preis-Import mit Feed</h1>
            <p>Links, CSV oder JSON importieren. Preise werden aus dem Feed übernommen.</p>
          </div>

          <div className="admin-top-actions-v2 admin-top-actions-v3">
            <button
              className="cta-primary cta-large"
              onClick={runManualSync}
              disabled={syncLoading}
            >
              {syncLoading ? "Sync läuft..." : "Sync jetzt starten"}
            </button>

            <a className="cta-secondary cta-large" href="/">
              Zum Shop
            </a>
          </div>
        </section>

        <section className="admin-grid-v2 admin-grid-v3">
          <div>
            <div className="panel-v2 panel-v3 admin-form-v2 admin-form-v3">
              <div className="admin-tabs-v2 admin-tabs-v3">
                <button className={tab === "manual" ? "tab-active tab-large" : "tab-idle tab-large"} onClick={() => setTab("manual")}>Manuell</button>
                <button className={tab === "import" ? "tab-active tab-large" : "tab-idle tab-large"} onClick={() => setTab("import")}>Smart Import</button>
                <button className={tab === "bulk" ? "tab-active tab-large" : "tab-idle tab-large"} onClick={() => setTab("bulk")}>Bulk Link</button>
                <button className={tab === "feed" ? "tab-active tab-large" : "tab-idle tab-large"} onClick={() => setTab("feed")}>Feed Import</button>
              </div>

              {tab === "manual" && (
                <>
                  <div className="eyebrow">{editingId ? "Bearbeiten" : "Neues Produkt"}</div>
                  <h2>{editingId ? "Produkt aktualisieren" : "Produkt anlegen"}</h2>

                  <input className="field-v2 field-large" placeholder="Produktname" value={name} onChange={(e) => setName(e.target.value)} />
                  <input className="field-v2 field-large" placeholder="Preis" value={price} onChange={(e) => setPrice(e.target.value)} />
                  <textarea className="field-v2 field-large textarea-v2 textarea-large" placeholder="Beschreibung" value={description} onChange={(e) => setDescription(e.target.value)} />
                  <input className="field-v2 field-large" placeholder="Verkaufslink / Kauf-URL" value={buyLink} onChange={(e) => setBuyLink(e.target.value)} />
                  <input className="field-v2 field-large" type="file" onChange={handleFile} />

                  {preview ? (
                    <div className="preview-v2 preview-large">
                      <img src={preview} alt="Vorschau" />
                    </div>
                  ) : null}

                  <button className="cta-primary full cta-large cta-xl" onClick={saveManualProduct}>
                    {editingId ? "Änderungen speichern" : "Produkt erstellen"}
                  </button>
                </>
              )}

              {tab === "import" && (
                <>
                  <div className="eyebrow">Einzel-Link Import</div>
                  <h2>Smart Import</h2>
                  <p className="muted-copy">Optionaler Preis wird direkt übernommen.</p>

                  <input className="field-v2 field-large" placeholder="Anbieter-Link" value={importLink} onChange={(e) => setImportLink(e.target.value)} />
                  <input className="field-v2 field-large" placeholder="Optionaler Produkttitel" value={importTitle} onChange={(e) => setImportTitle(e.target.value)} />
                  <input className="field-v2 field-large" placeholder="Optionaler Preis" value={importPrice} onChange={(e) => setImportPrice(e.target.value)} />

                  <button className="cta-primary full cta-large cta-xl" onClick={runSmartImport}>
                    Smart Import ausführen
                  </button>
                </>
              )}

              {tab === "bulk" && (
                <>
                  <div className="eyebrow">Mehrere Links</div>
                  <h2>Bulk Import</h2>

                  <textarea
                    className="field-v2 field-large textarea-v2 textarea-large"
                    placeholder={"https://amazon.de/...\nhttps://otto.de/..."}
                    value={bulkLinks}
                    onChange={(e) => setBulkLinks(e.target.value)}
                  />

                  <button className="cta-primary full cta-large cta-xl" onClick={runBulkImport}>
                    Bulk Import starten
                  </button>
                </>
              )}

              {tab === "feed" && (
                <>
                  <div className="eyebrow">CSV oder JSON</div>
                  <h2>Feed Import</h2>
                  <p className="muted-copy">Für automatische Preise brauchst du einen Feed. Nutze JSON oder CSV mit Preis-Spalte.</p>

                  <textarea
                    className="field-v2 field-large textarea-v2 textarea-large"
                    placeholder={'JSON Beispiel:\n[{"name":"Produkt A","price":"199","buy_link":"https://amazon.de/...","image":"https://..."}]\n\nCSV Beispiel:\nname,price,buy_link,image,description\nProdukt A,199,https://amazon.de/...,https://...,Top Deal'}
                    value={feedText}
                    onChange={(e) => setFeedText(e.target.value)}
                  />

                  <button className="cta-primary full cta-large cta-xl" onClick={runFeedImport}>
                    Feed importieren
                  </button>
                </>
              )}

              {message ? <p className="msg-info">{message}</p> : null}
            </div>

            <div className="panel-v2 panel-v3 sync-panel-v3">
              <div className="eyebrow">Auto Sync</div>
              <h2>Letzte Läufe</h2>

              {syncResult ? (
                <div className="sync-result-v3">
                  <pre>{JSON.stringify(syncResult, null, 2)}</pre>
                </div>
              ) : null}

              {syncRuns.length === 0 ? (
                <p className="muted-copy">Noch keine Sync-Historie vorhanden.</p>
              ) : (
                <div className="sync-runs-v3">
                  {syncRuns.map((run) => (
                    <article key={run.id} className="sync-run-card-v3">
                      <strong>{run.source_name || "default"}</strong>
                      <p>Items: {run.item_count ?? 0}</p>
                      <p>{new Date(run.created_at).toLocaleString("de-DE")}</p>
                      <p className="sync-run-key-v3">{run.run_key}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel-v2 panel-v3 admin-list-v2 admin-list-v3">
            <div className="admin-list-top-v2 admin-list-top-v3">
              <div>
                <div className="eyebrow">Archiv</div>
                <h2>Produkte</h2>
              </div>

              <input
                className="field-v2 field-large search-v2"
                placeholder="Suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="admin-cards-v2 admin-cards-v3">
              {filteredProducts.length === 0 ? (
                <div className="empty-v2">
                  <h3>Keine Produkte gefunden</h3>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <article key={product.id} className="admin-card-v2 admin-card-v3">
                    <img
                      src={product.image || "https://via.placeholder.com/800x600?text=Produkt"}
                      alt={product.name}
                    />

                    <div className="admin-card-content-v2 admin-card-content-v3">
                      <div className="admin-card-head-v2 admin-card-head-v3">
                        <h3>{product.name}</h3>
                        <strong>{product.price} €</strong>
                      </div>

                      <p>{product.description || "Keine Beschreibung hinterlegt."}</p>

                      <p className="link-preview">
                        {product.buy_link ? <>Link: {product.buy_link}</> : null}
                      </p>

                      <div className="admin-buttons-v2 admin-buttons-v3">
                        <button className="cta-secondary cta-large" onClick={() => editProduct(product)}>
                          Bearbeiten
                        </button>
                        <button className="danger-v2 danger-large" onClick={() => deleteProduct(product)}>
                          Löschen
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
