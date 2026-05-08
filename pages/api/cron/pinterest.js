export default async function handler(req, res) {

  const token = process.env.PINTEREST_ACCESS_TOKEN;

  res.status(200).json({
    tokenExists: !!token,
    preview: token?.slice(0, 15)
  });

}
