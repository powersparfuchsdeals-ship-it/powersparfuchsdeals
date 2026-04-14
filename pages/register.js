import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function register() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    alert('Registrierung erfolgreich. Du kannst dich jetzt einloggen.');
    location.href = '/login';
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="micro-label">Authorization Request</div>
        <h1>Neuen Zugang erstellen</h1>
        <p>Erstelle dein Konto für das Control Deck und den Produktzugriff.</p>

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

        <button className="primary-btn auth-btn" onClick={register}>Zugang erstellen</button>
        <p className="auth-switch">
          Bereits registriert? <a href="/login">Zum Login</a>
        </p>
      </div>
    </div>
  );
}
