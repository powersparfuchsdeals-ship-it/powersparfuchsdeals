export default async function handler(req, res) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.orbital-noir.com";

  try {
    const response = await fetch(`${baseUrl}/api/cron/import-amazon`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`
      }
    });

    const data = await response.json();

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || "Manual Sync Fehler"
    });
  }
}
