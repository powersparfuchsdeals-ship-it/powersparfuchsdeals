import Head from "next/head";

export default function AutoFullPage() {
  const affiliateLink = "https://tidd.ly/48CsSYm";

  return (
    <>
      <Head>
        <title>AutoFull Gamingstuhl Test & Erfahrungen 2026</title>
        <meta
          name="description"
          content="AutoFull Gamingstuhl im Test. Lohnt sich der Kauf? Alle Infos zu Komfort, Preis und Qualität."
        />
      </Head>

      <div style={styles.container}>
        <h1 style={styles.title}>
          AutoFull Gamingstuhl – lohnt sich der Kauf?
        </h1>

        <p style={styles.text}>
          AutoFull Gamingstühle gehören zu den beliebtesten Premium-Stühlen im
          Gaming-Bereich. Sie bieten eine Kombination aus Komfort, Design und
          Stabilität und sind besonders für längere Gaming-Sessions geeignet.
        </p>

        <p style={{ marginTop: 10, fontSize: 14 }}>
      ✔ Direkt beim Hersteller kaufen<br />
      ✔ 3 Jahre Garantie<br />
      ✔ Kostenloser Versand (je nach Angebot)
    </p>    
        <img
          src="https://www.autofull.eu/cdn/shop/files/auto-full-chair.jpg"
          alt="AutoFull Gamingstuhl"
          style={styles.image}
        />

        <h2>Vorteile</h2>
        <ul>
          <li>Sehr hoher Sitzkomfort</li>
          <li>3 Jahre Garantie</li>
          <li>Stabile Verarbeitung</li>
          <li>Ideal für Gaming & Home Office</li>
        </ul>

        <h2>Nachteile</h2>
        <ul>
          <li>Teurer als einfache Stühle</li>
        </ul>

        <div style={styles.box}>
          <h3>🔥 Aktuellen Preis bei AutoFull prüfen</h3>

          <a
          href={affiliateLink}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          style={styles.button}
       >
          Jetzt bei AutoFull ansehen
        </a>
      </div>

        <h2>Fazit</h2>
        <p style={styles.text}>
          Wenn du einen hochwertigen Gamingstuhl suchst, ist AutoFull eine sehr
          gute Wahl. Besonders durch die lange Garantie und die hohe Qualität
          hebt sich der Stuhl von günstigeren Modellen ab.
        </p>
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: 20,
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
  text: {
    marginBottom: 15,
    lineHeight: 1.6,
  },
  image: {
    width: "100%",
    borderRadius: 10,
    marginBottom: 20,
  },
  box: {
    background: "#fff3cd",
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    textAlign: "center",
  },
  button: {
    display: "inline-block",
    marginTop: 10,
    padding: "12px 20px",
    background: "#ff9900",
    color: "#000",
    fontWeight: "bold",
    borderRadius: 6,
    textDecoration: "none",
  },
};
