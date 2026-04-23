import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
    window.dispatchEvent(new Event("cookie-consent-accepted"));
  }

  function decline() {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.box}>
        <p style={styles.text}>
          🍪 Wir nutzen Cookies für Analyse & bessere Deals.
        </p>

        <div style={styles.actions}>
          <button onClick={accept} style={styles.accept}>
            Akzeptieren
          </button>
          <button onClick={decline} style={styles.decline}>
            Ablehnen
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 9999
  },
  box: {
    background: "#111827",
    color: "#fff",
    padding: "16px",
    borderRadius: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap"
  },
  text: {
    margin: 0
  },
  actions: {
    display: "flex",
    gap: "10px"
  },
  accept: {
    background: "#22c55e",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer"
  },
  decline: {
    background: "#374151",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer"
  }
};
