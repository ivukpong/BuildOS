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

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a date according to the configured dateFormat
 * (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, or DD-MMM-YYYY).
 * Returns an empty string for invalid/empty input.
 */
export function formatDateByGeneralSettings(
  value: string | number | Date | null | undefined,
): string {
  const d = toDate(value);
  if (!d) return "";
  const { dateFormat } = getGeneralSettings();

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mmm = d.toLocaleString("en-US", { month: "short" });

  switch (dateFormat) {
    case "DD/MM/YYYY":
      return `${dd}/${mm}/${yyyy}`;
    case "YYYY-MM-DD":
      return `${yyyy}-${mm}-${dd}`;
    case "DD-MMM-YYYY":
      return `${dd}-${mmm}-${yyyy}`;
    case "MM/DD/YYYY":
    default:
      return `${mm}/${dd}/${yyyy}`;
  }
}

/**
 * Formats a time according to the configured timeFormat ("12" or "24").
 */
export function formatTimeByGeneralSettings(
  value: string | number | Date | null | undefined,
): string {
  const d = toDate(value);
  if (!d) return "";
  const hour12 = getGeneralSettings().timeFormat !== "24";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  });
}

/**
 * Formats a combined date + time according to the configured settings.
 */
export function formatDateTimeByGeneralSettings(
  value: string | number | Date | null | undefined,
): string {
  const date = formatDateByGeneralSettings(value);
  if (!date) return "";
  const time = formatTimeByGeneralSettings(value);
  return time ? `${date} ${time}` : date;
}

/**
 * Formats a plain number according to the configured numberFormat
 * (thousands/decimal separators), without a currency symbol.
 */
export function formatNumberByGeneralSettings(
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  const safe = Number.isFinite(value) ? value : 0;
  const settings = getGeneralSettings();
  const locale = getNumberLocale(settings.numberFormat);
  let formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(safe);

  if (settings.numberFormat === "1 234.56") {
    formatted = formatted.replace(/,/g, " ");
  }
  return formatted;
}
