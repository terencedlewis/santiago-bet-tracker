export function quoteCsvField(value: string) {
  const needsQuote = value.includes(",") || value.includes("\"") || value.includes("\n") || value.includes("\r");
  if (!needsQuote) return value;
  return `"${value.replaceAll('"', '""')}"`;
}
