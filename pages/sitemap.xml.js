const SITE_URL = "https://orbital-noir.com";

const staticPages = [
  "",
  "technik-unter-50",
  "amazon-technik-deals",
  "gaming-zubehoer-guenstig",
  "kopfhoerer-angebote",
  "smart-home-gadgets",
  "gamingstuhl-autofull",
];

function generateSitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map((page) => {
    const url = page ? `${SITE_URL}/${page}` : SITE_URL;

    return `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>`;
  })
  .join("")}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const sitemap = generateSitemap();

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default function Sitemap() {
  return null;
}
