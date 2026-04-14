import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin({ session, authReady }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authReady && !session) {
      location.href = '/login';
    }
  }, [authReady, session]);

  async function upload() {
    if (!session?.user) return setMessage('Bitte erst einloggen.');
    if (!name || !price || !file) return setMessage('Bitte Name, Preis und Bild ausfüllen.');

    setSaving(true);
    setMessage('');

    const fileName = `${Date.now()}-${file.name}`;
    const uploadResult = await supabase.storage.from('images').upload(fileName, file);

    if (uploadResult.error) {
      setMessage(uploadResult.error.message);
      setSaving(false);
      return;
    }

    const { data } = supabase.storage.from('images').getPublicUrl(fileName);

    const insertResult = await supabase.from('products').insert([{
      name,
      price,
      description,
      image: data.publicUrl,
      user_id: session.user.id
    }]);

    if (insertResult.error) {
      setMessage(insertResult.error.message);
      setSaving(false);
      return;
    }

    location.href = '/';
  }

  if (!authReady) {
    return (
      <div className="auth-page">
        <div className="auth-panel wide-panel">
          <div className="micro-label">Control Deck</div>
          <h1>Zugriff wird geprüft</h1>
          <p>Bitte einen Moment warten …</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="auth-page">
      <div className="auth-panel wide-panel">
        <div className="micro-label">Control Deck</div>
        <h1>Neues Modul einspeisen</h1>
        <p>Lege ein Produkt mit Bild, Preis und Beschreibung im Orbital-Noir-Stil an.</p>

        <input
          className="field"
          placeholder="Produktname"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="field"
          placeholder="Preis in Euro"
          onChange={(e) => setPrice(e.target.value)}
        />
        <textarea
          className="field field-area"
          placeholder="Beschreibung"
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="field field-file"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {message ? <p className="auth-error">{message}</p> : null}

        <div className="admin-actions">
          <button className="primary-btn auth-btn" onClick={upload} disabled={saving}>
            {saving ? 'Speichere Modul...' : 'Modul speichern'}
          </button>
          <a className="ghost-btn" href="/">Zurück ins Archiv</a>
        </div>
      </div>
    </div>
  );
}
