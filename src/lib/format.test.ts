import { describe, expect, it } from "vitest";
import { formatDuration, formatEn, formatId, formatNumber } from "./format";

describe("formatNumber", () => {
  it("angka kecil tidak dibulatkan berlebihan", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(9.74)).toBe("9.7");
    expect(formatNumber(42.9)).toBe("42");
    expect(formatNumber(999)).toBe("999");
  });

  it("memakai satuan singkat di atas seribu", () => {
    expect(formatNumber(1_000)).toBe("1.00K");
    expect(formatNumber(15_230)).toBe("15.2K");
    expect(formatNumber(8_470_000)).toBe("8.47M");
    expect(formatNumber(1e12)).toBe("1.00T");
  });

  it("nilai tak terhingga jadi simbol", () => {
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("∞");
    expect(formatNumber(Number.NaN)).toBe("∞");
  });
});

describe("formatDuration", () => {
  it("detik saja di bawah satu menit", () => {
    expect(formatDuration(0)).toBe("0d");
    expect(formatDuration(1_900)).toBe("1d");
    expect(formatDuration(59_000)).toBe("59d");
  });

  it("menit tanpa sisa detik tidak menampilkan 0d", () => {
    expect(formatDuration(45 * 60_000)).toBe("45m");
    expect(formatDuration(90_000)).toBe("1m 30d");
  });

  it("jam membuang menit kalau nol", () => {
    expect(formatDuration(3_600_000)).toBe("1j");
    expect(formatDuration(3_930_000)).toBe("1j 5m");
    expect(formatDuration(8 * 3_600_000)).toBe("8j");
  });

  it("durasi negatif dijepit ke nol", () => {
    expect(formatDuration(-5_000)).toBe("0d");
  });
});

describe("formatId / formatEn", () => {
  it("pemisah ribuan mengikuti locale", () => {
    expect(formatId(14_170)).toBe("14.170");
    expect(formatEn(14_855)).toBe("14,855");
  });
});
