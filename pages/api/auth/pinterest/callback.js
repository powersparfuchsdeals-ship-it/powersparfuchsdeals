export default async function handler(req, res) {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).json({ error });
    }

    if (!code) {
      return res.status(400).json({ error: "Kein Code erhalten" });
    }

    const basicAuth = Buffer.from(
      `${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`
    ).toString("base64");

    const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://orbital-noir.com/api/auth/pinterest/callback",
      }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
