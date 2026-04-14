import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Register({ session, authReady }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authReady && session) {
      location.href = '/admin';
    }
  }, [authReady, session]);

  async function register() {
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data?.user && data.user.identities && data.user.identities.length > 0) {
        setMessage('Registrierung erfolgreich. Du kannst dich jetzt einloggen.');
        setTimeout(() => {
          location.href = '/login';
        }, 1200);
        return;
      }

      setMessage('Registrierung erfolgreich. Prüfe dein E-Mail-Postfach zur Bestätigung und logge dich danach ein.');
    } catch (_err) {
      setMessage('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) {
    return (
      <div className="auth-page">
        <div className="auth-panel">
          <div className="micro-label">Authorization Request</div>
          <h1>Session wird geprüft</h1>
          <p>Bitte einen Moment warten …</p>
        </div>
      </div>
    );
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="field"
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary-btn auth-btn" onClick={register} disabled={loading}>
          {loading ? 'Erstelle Zugang...' : 'Zugang erstellen'}
        </button>

        {message ? <p className="auth-info">{message}</p> : null}

        <p className="auth-switch">
          Bereits registriert? <a href="/login">Zum Login</a>
        </p>
      </div>
    </div>
  );
}
