export function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}
