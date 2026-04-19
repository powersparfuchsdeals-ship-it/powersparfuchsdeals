import { requireAdminApi } from "../../../lib/requireAdminApi";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const adminUser = await requireAdminApi(req, res);
  if (!adminUser) return;

  try {
    const partnerTag = process.env.AMAZON_PARTNER_TAG || "";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    const checks = {
      partnerTagExists: !!partnerTag,
      partnerTagFormatLooksValid: /.+-\d+$/.test(partnerTag),
      partnerTagEndsWith21: partnerTag.endsWith("-21"),
      siteUrlExists: !!siteUrl,
      feedEndpointReachable: false,
      feedReturnsArray: false,
      feedHasItems: false,
      buyLinksContainTag: false
    };

    let sampleItems = [];

    if (siteUrl) {
      const feedUrl = `${siteUrl}/api/amazon-feed?q=kopfh%C3%B6rer`;

      const response = await fetch(feedUrl, { cache: "no-store" });
      checks.feedEndpointReachable = response.ok;

      if (response.ok) {
        const data = await response.json();
        checks.feedReturnsArray = Array.isArray(data);
        checks.feedHasItems = Array.isArray(data) && data.length > 0;
        sampleItems = Array.isArray(data) ? data.slice(0, 3) : [];

        if (sampleItems.length && partnerTag) {
          checks.buyLinksContainTag = sampleItems.every((item) =>
            String(item.buy_link || "").includes(`tag=${partnerTag}`)
          );
        }
      }
    }

    return res.status(200).json({
      ok: true,
      partnerTag,
      siteUrl,
      checks,
      sampleItems
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Amazon Check Fehler"
    });
  }
}
