import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  async function loadProduct() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (!error) {
      setProduct(data);
    }
  }

  if (!product) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#040611",
          color: "white",
          padding: "40px"
        }}
      >
        Produkt wird geladen...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#040611",
        color: "white",
        padding: "40px 16px"
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          background: "rgba(15,20,44,0.92)",
          border: "1px solid rgba(150,173,255,0.14)",
          borderRadius: "24px",
          padding: "24px"
        }}
      >
        <a
          href="/"
          style={{
            display: "inline-block",
            marginBottom: "20px",
            color: "#bfefff"
          }}
        >
          ← Zurück zum Shop
        </a>

        <img
          src={product.image || "https://via.placeholder.com/1200x900?text=Produkt"}
          alt={product.name}
          style={{
            width: "100%",
            maxHeight: "520px",
            objectFit: "cover",
            borderRadius: "20px",
            marginBottom: "24px"
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 600px" }}>
            <h1 style={{ marginTop: 0, fontSize: "42px" }}>{product.name}</h1>
            <p style={{ color: "#97a7ce", lineHeight: "1.8", fontSize: "18px" }}>
              {product.description || "Keine Beschreibung vorhanden."}
            </p>
          </div>

          <div style={{ minWidth: "220px" }}>
            <div style={{ fontSize: "34px", fontWeight: "700", marginBottom: "20px" }}>
              {product.price} €
            </div>

            {product.buy_link ? (
              <a
                href={product.buy_link}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, rgba(124,232,255,.18), rgba(143,107,255,.24))",
                  border: "1px solid rgba(162,187,255,.28)",
                  color: "white",
                  textDecoration: "none"
                }}
              >
                Jetzt kaufen
              </a>
            ) : (
              <div style={{ color: "#97a7ce" }}>Kein Verkaufslink hinterlegt.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
