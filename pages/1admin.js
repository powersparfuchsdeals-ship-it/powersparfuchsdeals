import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();

      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;
      const userEmail = (session?.user?.email || "").toLowerCase();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      if (!adminEmail || userEmail !== adminEmail) {
        alert(`Kein Admin-Zugriff.\nLogin: ${userEmail}\nAdmin ENV: ${adminEmail}`);
        window.location.href = "/";
        return;
      }

      setReady(true);
    }

    checkAdmin();
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", padding: "40px", fontFamily: "Inter, sans-serif" }}>
        <h1>Prüfe Admin-Zugriff…</h1>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "40px", fontFamily: "Inter, sans-serif" }}>
      <h1>Admin ok</h1>
      <p>Du bist korrekt als Admin eingeloggt.</p>
    </div>
  );
}
