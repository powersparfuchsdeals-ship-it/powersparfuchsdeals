export default async function handler(req, res) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const partnerTag = process.env.AMAZON_PARTNER_TAG || "";

  return res.status(200).json({
    ok: true,
    debug: {
      supabaseUrlExists: !!supabaseUrl,
      partnerTagExists: !!partnerTag,
      serviceKeyExists: !!serviceKey,
      serviceKeyPrefix: serviceKey.slice(0, 20),
      looksLikeSecretKey: serviceKey.startsWith("sb_secret_")
    }
  });
}
1
