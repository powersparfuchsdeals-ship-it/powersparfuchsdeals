import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/admin";
    });
  }, []);

  async function login() {
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="micro-label">Access Terminal</div>
        <h1>Login</h1>
        <p>Melde dich an, um Produkte zu verwalten.</p>

        <input className="field" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button className="primary-btn auth-btn" onClick={login}>Einloggen</button>
        {message ? <p className="auth-error">{message}</p> : null}

        <p className="auth-switch">
          Noch kein Konto? <a href="/register">Jetzt registrieren</a>
        </p>
      </div>
    </div>
  );
}
