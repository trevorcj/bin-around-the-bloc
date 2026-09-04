export default function formatCurrency(amount, currency = "USD") {
  const numericAmount = Number(amount);

  if (isNaN(numericAmount)) return "";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}
