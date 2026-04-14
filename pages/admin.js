import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      location.href = '/login';
      return;
    }
    setUser(data.user);
  }

  async function upload() {
    if (!user) return alert('Bitte erst einloggen.');
    if (!name || !price || !file) return alert('Bitte Name, Preis und Bild ausfüllen.');

    const fileName = Date.now() + '-' + file.name;
    const uploadResult = await supabase.storage.from('images').upload(fileName, file);

    if (uploadResult.error) {
      alert(uploadResult.error.message);
      return;
    }

    const { data } = supabase.storage.from('images').getPublicUrl(fileName);

    const insertResult = await supabase.from('products').insert([{
      name,
      price,
      description,
      image: data.publicUrl,
      user_id: user.id
    }]);

    if (insertResult.error) {
      alert(insertResult.error.message);
      return;
    }

    alert('Modul gespeichert');
    location.href = '/';
  }

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

        <div className="admin-actions">
          <button className="primary-btn auth-btn" onClick={upload}>Modul speichern</button>
          <a className="ghost-btn" href="/">Zurück ins Archiv</a>
        </div>
      </div>
    </div>
  );
}
