import { supabaseAdmin } from "./supabaseAdmin";
import { isAdminEmail } from "./isAdmin";

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

export async function requireAdminApi(req, res) {
  const accessToken = getBearerToken(req);

  if (!accessToken) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data?.user) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return null;
  }

  const email = data.user.email || "";
  if (!isAdminEmail(email)) {
    res.status(403).json({ ok: false, error: "Forbidden" });
    return null;
  }

  return data.user;
}
