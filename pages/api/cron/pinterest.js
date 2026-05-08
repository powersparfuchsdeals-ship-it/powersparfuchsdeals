export default async function handler(req, res) {
  try {
    const token = process.env.PINTEREST_ACCESS_TOKEN;
    const boardId = process.env.PINTEREST_BOARD_ID;

    const response = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        board_id: boardId,
        title: "Orbital-Noir Test Deal",
        description: "Automatisch erstellter Test-Pin von Orbital-Noir.",
        media_source: {
          source_type: "image_url",
          url: "https://orbital-noir.com/test.jpg",
        },
        link: "https://orbital-noir.com",
      }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
