
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin({ session, authReady }) {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authReady && !session) {
      location.href = '/login';
    }
    loadProducts();
  }, [authReady]);

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
  }

  function handleFile(e) {
    const f = e.target.files[0];
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function saveProduct() {
    if (!name || !price) return setMessage('Bitte Name & Preis angeben');

    let imageUrl = null;

    if (file) {
      const fileName = Date.now() + '-' + file.name;
      const upload = await supabase.storage.from('images').upload(fileName, file);
      if (upload.error) return setMessage(upload.error.message);

      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    if (editingId) {
      await supabase.from('products').update({
        name, price, description,
        ...(imageUrl && { image: imageUrl })
      }).eq('id', editingId);

      setMessage('Produkt aktualisiert');
    } else {
      await supabase.from('products').insert([{
        name, price, description,
        image: imageUrl,
        user_id: session.user.id
      }]);

      setMessage('Produkt erstellt');
    }

    resetForm();
    loadProducts();
  }

  async function deleteProduct(id) {
    if (!confirm('Wirklich löschen?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadProducts();
  }

  function editProduct(p) {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price);
    setDescription(p.description || '');
    setPreview(p.image);
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setPrice('');
    setDescription('');
    setFile(null);
    setPreview(null);
  }

  if (!authReady) return <div>Lädt...</div>;
  if (!session) return null;

  return (
    <div style={{padding:"30px"}}>
      <h1>Admin Dashboard</h1>

      <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
      <input placeholder="Preis" value={price} onChange={e=>setPrice(e.target.value)} />
      <textarea placeholder="Beschreibung" value={description} onChange={e=>setDescription(e.target.value)} />

      <input type="file" onChange={handleFile} />
      {preview && <img src={preview} style={{width:"200px"}} />}

      <button onClick={saveProduct}>
        {editingId ? 'Speichern' : 'Erstellen'}
      </button>

      {editingId && <button onClick={resetForm}>Abbrechen</button>}

      {message && <p>{message}</p>}

      <h2>Produkte</h2>

      {products.map(p=>(
        <div key={p.id} style={{display:"flex",gap:"20px",marginTop:"20px"}}>
          <img src={p.image} style={{width:"100px"}} />
          <div>
            <h3>{p.name}</h3>
            <p>{p.price} €</p>
          </div>
          <button onClick={()=>editProduct(p)}>Bearbeiten</button>
          <button onClick={()=>deleteProduct(p.id)}>Löschen</button>
        </div>
      ))}
    </div>
  );
}
