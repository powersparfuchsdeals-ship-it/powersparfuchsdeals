import Head from "next/head";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  buy_link: string;
  tag?: string;
  merchant?: string;
};

export default function TVAngebotePage({ products }: { products: Product[] }) {
  return (
    <>
      <Head>
        <title>🔥 TV Angebote 2026 – Top Deals & Preisfehler</title>
        <meta
          name="description"
          content="Finde die besten TV Angebote mit echten Preisfehlern und Top Deals. Täglich aktualisiert."
        />
      </Head>

      <main style={{ padding: "20px", maxWidth: 1200, margin: "0 auto" }}>
        <h1>🔥 TV Angebote & Preisfehler</h1>

        <p style={{ marginBottom: 20 }}>
          Hier findest du die besten TV Angebote mit echten Preisfehlern und
          stark reduzierten Deals. Unsere Angebote werden automatisch analysiert
          und nach Preis, Beliebtheit und Aktualität sortiert.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          {products.map((product) => (
            <a
              key={product.id}
              href={product.buy_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                border: "1px solid #eee",
                borderRadius: "12px",
                padding: "10px",
                textDecoration: "none",
                color: "black",
                display: "block",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 160,
                  overflow: "hidden",
                  borderRadius: "8px",
                }}
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>

              <h3 style={{ fontSize: 14, marginTop: 10 }}>
                {product.name}
              </h3>

              <p style={{ fontWeight: "bold" }}>
                {product.price} €
              </p>

              {product.tag === "preisfehler" && (
                <span style={{ color: "red", fontWeight: "bold" }}>
                  🔥 Preisfehler
                </span>
              )}

              {product.tag === "featured" && (
                <span style={{ color: "green", fontWeight: "bold" }}>
                  ⭐ Top Deal
                </span>
              )}
            </a>
          ))}
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/top-deals`);
    const data = await res.json();

    const tvs = data.filter(
      (p: Product) =>
        p.name.toLowerCase().includes("tv") ||
        p.name.toLowerCase().includes("fernseher")
    );

    return {
      props: {
        products: tvs.slice(0, 20),
      },
    };
  } catch (err) {
    return {
      props: {
        products: [],
      },
    };
  }
}
