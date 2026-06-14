export interface GeneralSettingsConfig {
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  fiscalYearStart: string;
  language: string;
}

const defaultGeneralSettings: GeneralSettingsConfig = {
  currency: "USD",
  currencySymbol: "$",
  timezone: "America/New_York",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12",
  numberFormat: "1,234.56",
  fiscalYearStart: "01",
  language: "en",
};

function getNumberLocale(numberFormat: string): string {
  if (numberFormat === "1.234,56") return "de-DE";
  if (numberFormat === "1 234.56") return "en-US";
  return "en-US";
}

export function getGeneralSettings(): GeneralSettingsConfig {
  if (typeof window === "undefined") return { ...defaultGeneralSettings };

  try {
    const raw = localStorage.getItem("buildos_general_settings");
    if (!raw) return { ...defaultGeneralSettings };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { ...defaultGeneralSettings };
    }
    return { ...defaultGeneralSettings, ...parsed };
  } catch {
    return { ...defaultGeneralSettings };
  }
}

export function formatCurrencyByGeneralSettings(
  amount: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  const settings = getGeneralSettings();
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const minimumFractionDigits = options?.minimumFractionDigits ?? 0;
  const maximumFractionDigits = options?.maximumFractionDigits ?? 0;
  const locale = getNumberLocale(settings.numberFormat);

  try {
    let formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: settings.currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(safeAmount);

    if (settings.numberFormat === "1 234.56") {
      formatted = formatted.replace(/,/g, " ");
    }

    return formatted;
  } catch {
    const absolute = Math.abs(safeAmount).toLocaleString();
    const sign = safeAmount < 0 ? "-" : "";
    return `${sign}${settings.currencySymbol}${absolute}`;
  }
}

export function getCurrencySymbol(): string {
  return getGeneralSettings().currencySymbol || "$";
}
