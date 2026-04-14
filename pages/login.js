import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    location.href = '/admin';
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="micro-label">Access Terminal</div>
        <h1>Eintritt in Orbital Noir</h1>
        <p>Authentifiziere dich, um neue Module ins Archiv einzuspeisen.</p>

        <input
          className="field"
          placeholder="E-Mail"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="field"
          type="password"
          placeholder="Passwort"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary-btn auth-btn" onClick={login}>Login</button>
        <p className="auth-switch">
          Noch kein Zugang? <a href="/register">Zugang anfordern</a>
        </p>
      </div>
    </div>
  );
}
