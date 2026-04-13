import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin(){
  const [user,setUser]=useState(null);
  const [name,setName]=useState('');
  const [price,setPrice]=useState('');
  const [file,setFile]=useState(null);

  useEffect(()=>{
    checkUser();
  },[]);

  async function checkUser(){
    const { data } = await supabase.auth.getUser();
    if(!data.user){
      location.href = "/login";
    } else {
      setUser(data.user);
    }
  }

  async function upload(){
    if(!file) return alert("Bild fehlt");

    const fileName = Date.now()+file.name;

    await supabase.storage.from('images').upload(fileName,file);

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    await supabase.from('products').insert([{
      name,
      price,
      image: data.publicUrl,
      user_id: user.id
    }]);

    alert("Produkt gespeichert!");
    location.reload();
  }

  return (
    <div style={{padding:"40px"}}>
      <h1>Admin Bereich</h1>

      <input placeholder="Name" onChange={e=>setName(e.target.value)} />
      <input placeholder="Preis" onChange={e=>setPrice(e.target.value)} />
      <input type="file" onChange={e=>setFile(e.target.files[0])} />

      <button onClick={upload}>Upload</button>
    </div>
  );
}
