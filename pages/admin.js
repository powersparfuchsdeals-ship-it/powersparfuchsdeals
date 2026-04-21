import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [buyLink, setBuyLink] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = "/login";
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
    setFile(null);
    setPreview(null);
  }

  function editProduct(product) {
    setEditingId(product.id);
    setName(product.name || "");
    setPrice(product.price || "");
    setDescription(product.description || "");
    setBuyLink(product.buy_link || "");
    setPreview(product.image || null);
    setFile(null);
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
        buy_link: buyLink
      };

      if (imageUrl) {
        payload.image = imageUrl;
      }

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

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) =>
      [p.name, p.description, p.buy_link, String(p.price)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [products, search]);

  if (!supabase) {
    return (
      <div style={styles.centerWrap}>
        <h1 style={styles.title}>Supabase fehlt</h1>
        <p style={styles.text}>
          Prüfe deine ENV Variablen für Supabase.
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
            <h1 style={styles.mainTitle}>Admin</h1>
            <p style={styles.text}>Produkte anlegen, bearbeiten und löschen.</p>
          </div>

          <a href="/" style={styles.secondaryButton}>
            Zum Shop
          </a>
        </header>

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

            {message ? <div style={styles.message}>{message}</div> : null}
          </section>

          <section style={styles.panel}>
            <div style={styles.listHeader}>
              <div>
                <div style={styles.eyebrow}>Produkte</div>
                <h2 style={styles.sectionTitle}>Liste</h2>
              </div>

              <input
                style={styles.searchInput}
                placeholder="Suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
    marginTop: "14px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #e5e7eb"
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
