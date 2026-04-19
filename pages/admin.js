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

  // 🔐 SESSION + LOAD
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

  // 🎨 THEME LOAD
  useEffect(() => {
    const saved = localStorage.getItem("admin-theme");
    if (saved) setTheme(saved);
  }, []);

  // 🎨 THEME APPLY
  useEffect(() => {
    document.body.classList.remove("dark", "blue", "green");
    document.body.classList.add(theme);
    localStorage.setItem("admin-theme", theme);
  }, [theme]);

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
    if (data.ok) setSyncRuns(data.runs || []);
  }

  async function runManualSync() {
    if (!session?.access_token) return;

    setSyncLoading(true);
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
        setMessage("Sync erfolgreich");
        await loadProducts();
        await loadSyncRuns(session.access_token);
      } else {
        setMessage(data.error || "Fehler");
      }
    } catch {
      setMessage("Sync Fehler");
    }

    setSyncLoading(false);
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function saveManualProduct() {
    if (!session?.user) return;

    let imageUrl = null;

    if (file) {
      const fileName = `${Date.now()}-${file.name}`;
      await supabase.storage.from("images").upload(fileName, file);
      imageUrl = supabase.storage.from("images").getPublicUrl(fileName).data.publicUrl;
    }

    const payload = {
      name,
      price,
      description,
      buy_link: normalizeUrl(buyLink),
      image: imageUrl
    };

    if (editingId) {
      await supabase.from("products").update(payload).eq("id", editingId);
    } else {
      await supabase.from("products").insert([{ ...payload, user_id: session.user.id }]);
    }

    loadProducts();
  }

  async function runFeedImport() {
    let items = parseFeedText(feedText);

    const result = await importFeedRows({
      supabase,
      items,
      userId: session.user.id
    });

    setMessage(`${result.created} erstellt`);
    loadProducts();
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  if (!session) return null;

  return (
    <div className="admin-wrap-v3">

      {/* THEME SWITCH */}
      <div className="theme-switcher">
        <button onClick={() => setTheme("dark")}>Dark</button>
        <button onClick={() => setTheme("blue")}>Blue</button>
        <button onClick={() => setTheme("green")}>Green</button>
      </div>

      <button onClick={runManualSync}>
        {syncLoading ? "läuft..." : "Sync starten"}
      </button>

      <input placeholder="Suche" value={search} onChange={e => setSearch(e.target.value)} />

      <div>
        {filteredProducts.map(p => (
          <div key={p.id}>
            <h3>{p.name}</h3>
            <p>{p.price} €</p>
          </div>
        ))}
      </div>

    </div>
  );
}
