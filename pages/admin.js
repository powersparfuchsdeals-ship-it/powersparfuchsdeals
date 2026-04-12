import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin(){
const [name,setName]=useState('');
const [price,setPrice]=useState('');
const [file,setFile]=useState(null);

async function upload(){
const fileName = Date.now()+file.name;
await supabase.storage.from('images').upload(fileName,file);

const { data } = supabase.storage.from('images').getPublicUrl(fileName);

await supabase.from('products').insert([{
name,
price,
image: data.publicUrl
}]);

alert("Produkt gespeichert!");
}

return (
<div style={{padding:"40px"}}>
<h1>Admin Upload</h1>
<input placeholder="Name" onChange={e=>setName(e.target.value)} />
<input placeholder="Preis" onChange={e=>setPrice(e.target.value)} />
<input type="file" onChange={e=>setFile(e.target.files[0])} />
<button onClick={upload}>Upload</button>
</div>
);
}
