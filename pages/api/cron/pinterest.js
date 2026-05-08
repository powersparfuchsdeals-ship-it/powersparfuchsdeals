export default async function handler(req, res) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;

  const response = await fetch("https://api.pinterest.com/v5/boards", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  res.status(response.status).json(data);
}
