export function generateDevoteePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export function formatBookingDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function generateReceiptNumber(bookingId: string): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `RCPT-${datePart}-${bookingId.slice(-6).toUpperCase()}`;
}
