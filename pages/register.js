async function register() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert("Supabase-Fehler: " + error.message);
      return;
    }

    alert("Registrierung erfolgreich! Prüfe ggf. deine E-Mail.");
    console.log("Signup data:", data);
  } catch (err) {
    alert("Netzwerkfehler: " + err.message);
    console.error("Signup fetch error:", err);
  }
}