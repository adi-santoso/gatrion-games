import { describe, expect, it } from "vitest";
import { APPS, appFromPath, getApp } from "./apps";

describe("appFromPath", () => {
  it("memetakan deep link lama ke aplikasi", () => {
    expect(appFromPath("/wordle")).toBe("wordle");
    expect(appFromPath("/idle")).toBe("idle");
    expect(appFromPath("/settings")).toBe("settings");
  });

  it("mengabaikan garis miring di akhir", () => {
    expect(appFromPath("/wordle/")).toBe("wordle");
  });

  it("tidak membuka apa pun untuk beranda atau rute tak dikenal", () => {
    expect(appFromPath("/")).toBeNull();
    expect(appFromPath("/tentang")).toBeNull();
  });
});

describe("katalog aplikasi", () => {
  it("punya id unik dan ukuran jendela yang masuk akal", () => {
    const ids = APPS.map((app) => app.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const app of APPS) {
      expect(app.size.w).toBeGreaterThanOrEqual(380);
      expect(app.size.h).toBeGreaterThanOrEqual(280);
      expect(app.icon).toBeTruthy();
      expect(app.keywords.length).toBeGreaterThan(0);
    }
  });

  it("getApp mengembalikan definisi yang sama", () => {
    expect(getApp("idle").name).toBe("Idle Tambang");
    expect(getApp("settings").shortName).toBe("Pengaturan");
  });
});
