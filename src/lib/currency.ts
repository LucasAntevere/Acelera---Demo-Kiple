export function formatCurrencyFromNumber(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(safe);
}

export function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const cents = digits.length === 0 ? 0 : Number(digits);
  return formatCurrencyFromNumber(cents / 100);
}

export function currencyInputToNumber(masked: string): number {
  const digits = masked.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}
