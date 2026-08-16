const formatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCurrency(amountInCents: number): string {
  return formatter.format(amountInCents / 100);
}
