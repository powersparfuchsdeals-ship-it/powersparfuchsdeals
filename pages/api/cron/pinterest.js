export default async function handler(req, res) {
  try {
    const token = process.env.PINTEREST_ACCESS_TOKEN;

    const response = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Orbital-Noir Test Pin",
        description: "Automatisch geposteter Test-Pin",
        board_id: "BOARD_ID_HIER",
        media_source: {
          source_type: "image_url",
          url: "https://orbital-noir.com/test.jpg",
        },
        link: "https://orbital-noir.com",
      }),
    });

    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
}
