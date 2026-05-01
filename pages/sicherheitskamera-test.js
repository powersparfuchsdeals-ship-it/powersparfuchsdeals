import Head from "next/head";

export default function KameraTestPage() {
  return (
    <>
      <Head>
        <title>Sicherheitskamera Test 2026 – Die besten Modelle</title>
        <meta
          name="description"
          content="Die besten Sicherheitskameras im Vergleich. Top Modelle mit Nachtsicht, App & Bewegungserkennung."
        />
      </Head>

      <div style={styles.container}>
        <h1>Die besten Sicherheitskameras im Test</h1>

        <p>
          Sicherheitskameras sorgen für mehr Schutz in deinem Zuhause. Moderne
          Modelle bieten Nachtsicht, Bewegungserkennung und App-Steuerung.
        </p>

        {/* PRODUKT 1 */}
        <div style={styles.card}>
          <h2>Imou Sicherheitskamera</h2>

          <p>
            Sehr gute Kamera mit Nachtsicht und App-Steuerung. Ideal für
            Wohnung und Garten.
          </p>

          <a
            href="https://tidd.ly/4cUvZfy"
            target="_blank"
            rel="nofollow sponsored"
            style={styles.button}
          >
            Jetzt ansehen
          </a>
        </div>

        {/* PRODUKT 2 */}
        <div style={styles.card}>
          <h2>TP-Link Tapo Kamera</h2>

          <p>
            Günstige Einsteigerkamera mit guter Qualität und einfacher
            Einrichtung.
          </p>

          <a
            href="https://www.amazon.de/dp/B0866S3D82?tag=140570-21"
            target="_blank"
            rel="nofollow sponsored"
            style={styles.button}
          >
            Bei Amazon ansehen
          </a>
        </div>

        {/* PRODUKT 3 */}
        <div style={styles.card}>
          <h2>eufy Security Kamera</h2>

          <p>
            Premium Kamera ohne Abo mit sehr guter Bildqualität und
            zuverlässiger Bewegungserkennung.
          </p>

          <a
            href="https://www.amazon.de/dp/B08XH1WTBT?tag=140570-21"
            target="_blank"
            rel="nofollow sponsored"
            style={styles.button}
          >
            Jetzt ansehen
          </a>
        </div>

        <h2>Worauf solltest du achten?</h2>

        <p>
          Achte auf Full-HD Auflösung, Nachtsicht und eine stabile App.
          Modelle ohne Abo sind langfristig günstiger.
        </p>

        <h2>Fazit</h2>

        <p>
          Für Einsteiger ist TP-Link ideal. Wer mehr Qualität will, sollte zu
          eufy greifen. Imou bietet ein gutes Gesamtpaket.
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
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
