const UNITS: Array<{ value: number; suffix: string }> = [
  { value: 1e33, suffix: "Dc" },
  { value: 1e30, suffix: "No" },
  { value: 1e27, suffix: "Oc" },
  { value: 1e24, suffix: "Sp" },
  { value: 1e21, suffix: "Sx" },
  { value: 1e18, suffix: "Qi" },
  { value: 1e15, suffix: "Qa" },
  { value: 1e12, suffix: "T" },
  { value: 1e9, suffix: "B" },
  { value: 1e6, suffix: "M" },
  { value: 1e3, suffix: "K" },
];

/** 1234 -> "1.23K", 9.7 -> "9.7", 42 -> "42". */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  if (value < 1000) {
    return value < 10 ? (Math.round(value * 10) / 10).toString() : Math.floor(value).toString();
  }
  for (const unit of UNITS) {
    if (value >= unit.value) {
      const scaled = value / unit.value;
      const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
      return scaled.toFixed(digits) + unit.suffix;
    }
  }
  return Math.floor(value).toString();
}

/** 3_930_000 -> "1j 5m". */
export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) return minutes > 0 ? `${hours}j ${minutes}m` : `${hours}j`;
  if (minutes > 0) return rest > 0 ? `${minutes}m ${rest}d` : `${minutes}m`;
  return `${seconds}d`;
}

/** 14170 -> "14.170" dalam locale Indonesia. */
export function formatId(value: number): string {
  return value.toLocaleString("id-ID");
}

/** 14855 -> "14,855" dalam locale English. */
export function formatEn(value: number): string {
  return value.toLocaleString("en-US");
}
