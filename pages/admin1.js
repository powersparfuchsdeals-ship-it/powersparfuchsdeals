export default function LegacyAdmin() { return null; }
export function getServerSideProps() {
  return { redirect: { destination: "/admin", permanent: false } };
}
