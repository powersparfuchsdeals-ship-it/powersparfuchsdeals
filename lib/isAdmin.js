export function isAdminEmail(email) {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  if (!email || !adminEmail) return false;
  return String(email).toLowerCase() === String(adminEmail).toLowerCase();
}
