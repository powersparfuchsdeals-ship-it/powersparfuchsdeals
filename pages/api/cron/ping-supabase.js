const authHeader = req.headers.authorization;
const isVercelCron = req.headers["x-vercel-cron"] === "1";

if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return res.status(401).json({
    ok: false,
    error: "Unauthorized",
    hasAuth: !!authHeader,
    hasSecret: !!process.env.CRON_SECRET,
  });
}
