// Утилиты форматирования чисел и денег

// Форматирует сумму в деньгах: 25000 -> "$25 000", 1500000 -> "$1,5 млн"
export function formatMoney(value: number | null | undefined, currency = "USD"): string {
  if (value == null) return "—";
  const symbol = currencySymbol(currency);
  if (value >= 1_000_000_000) return `${symbol}${trim(value / 1_000_000_000)} млрд`;
  if (value >= 1_000_000) return `${symbol}${trim(value / 1_000_000)} млн`;
  if (value >= 1_000) return `${symbol}${trim(value / 1_000)} тыс`;
  return `${symbol}${trim(value)}`;
}

// Цена за акцию — показываем точнее, без сокращений
export function formatPrice(value: number | null | undefined, currency = "USD"): string {
  if (value == null) return "—";
  return `${currencySymbol(currency)}${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function trim(n: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(n);
}

function currencySymbol(currency: string): string {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "RUB":
      return "₽";
    case "AED":
      return "AED ";
    default:
      return `${currency} `;
  }
}

// Размер файла: 550905 -> "538 КБ"
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
