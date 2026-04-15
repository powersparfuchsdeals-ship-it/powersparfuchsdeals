import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function register() {
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Registrierung erfolgreich. Du kannst dich jetzt einloggen.");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="micro-label">Authorization Request</div>
        <h1>Registrieren</h1>
        <p>Erstelle dein Konto für Orbital-Noir.</p>

        <input className="field" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button className="primary-btn auth-btn" onClick={register}>Konto erstellen</button>
        {message ? <p className="auth-info">{message}</p> : null}

        <p className="auth-switch">
          Bereits registriert? <a href="/login">Zum Login</a>
        </p>
      </div>
    </div>
  );
}
