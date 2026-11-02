// Currency definitions and helpers
export const CURRENCIES = [
  { value: "CAD", label: "CAD ($) - Canadian Dollar (Default)", symbol: "$" },
  { value: "USD", label: "USD ($) - US Dollar", symbol: "$" },
  { value: "GBP", label: "GBP (£) - British Pound", symbol: "£" },
  { value: "EUR", label: "EUR (€) - Euro", symbol: "€" },
  { value: "PKR", label: "PKR (₨) - Pakistani Rupee", symbol: "₨" },
  { value: "INR", label: "INR (₹) - Indian Rupee", symbol: "₹" },
  { value: "AED", label: "AED (د.إ) - UAE Dirham", symbol: "د.إ" },
  { value: "SAR", label: "SAR (﷼) - Saudi Riyal", symbol: "﷼" },
  { value: "AUD", label: "AUD ($) - Australian Dollar", symbol: "$" },
  { value: "QAR", label: "QAR (﷼) - Qatari Riyal", symbol: "﷼" },
  { value: "KWD", label: "KWD (KD) - Kuwaiti Dinar", symbol: "KD" },
  { value: "MYR", label: "MYR (RM) - Malaysian Ringgit", symbol: "RM" },
  { value: "TRY", label: "TRY (₺) - Turkish Lira", symbol: "₺" },
];

export const getCurrencySymbol = (currencyCode = "CAD") => {
  const found = CURRENCIES.find(
    (c) => c.value.toUpperCase() === (currencyCode || "CAD").toUpperCase()
  );
  return found ? found.symbol : "$";
};

export const formatCurrency = (amount = 0, currencyCode = "CAD") => {
  const num = Number(amount) || 0;
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol} ${num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currencyCode || "CAD"}`;
};
