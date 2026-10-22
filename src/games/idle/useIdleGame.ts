import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ACHIEVEMENTS,
  CORE_UPGRADES,
  GENERATORS,
  RUN_UPGRADES,
  SAVE_VERSION,
  autoBuyStep,
  autoBuysPerTick,
  autoUpgradeStep,
  bulkCost,
  canPrestige,
  clickGain,
  clickUpgradeCost,
  coreGain,
  coreUpgradeCost,
  defaultSave,
  newlyUnlocked,
  offlineReport,
  prestige,
  production,
  runUpgradeCost,
  wantedCount,
} from "./economy";
import { loadIdleSave, saveIdleSave } from "./storage";
import type { BuyAmount, IdleSave, OfflineReport, PermId, UpgradeId } from "./types";

export interface IdleToast {
  id: number;
  text: string;
}

export function useIdleGame() {
  const initial = useMemo(() => {
    const loaded = loadIdleSave();
    const report = offlineReport(loaded);

    const base: IdleSave =
      report.gain < 1
        ? loaded
        : {
            ...loaded,
            crystals: loaded.crystals + report.gain,
            total: loaded.total + report.gain,
            allTime: Math.max(loaded.allTime, loaded.total + report.gain),
            best: Math.max(loaded.best, loaded.crystals + report.gain),
            ach: loaded.ach.includes("offline") ? loaded.ach : [...loaded.ach, "offline"],
            lastSeen: Date.now(),
          };

    // pencapaian yang sebenarnya sudah terpenuhi tapi belum tercatat
    const unlocked = newlyUnlocked(base);
    const save =
      unlocked.length > 0 ? { ...base, ach: [...base.ach, ...unlocked] } : base;

    return { save, report: report.gain < 1 ? null : report };
  }, []);

  const [save, setSave] = useState<IdleSave>(initial.save);
  const [offline, setOffline] = useState<OfflineReport | null>(initial.report);
  const [toast, setToast] = useState<IdleToast | null>(null);
  const [saveStatus, setSaveStatus] = useState("menunggu…");

  const saveRef = useRef(save);
  const toastId = useRef(0);
  const knownAch = useRef<string[]>(initial.save.ach);

  const notify = useCallback((text: string) => {
    toastId.current += 1;
    setToast({ id: toastId.current, text });
  }, []);

  const commit = useCallback((updater: (current: IdleSave) => IdleSave) => {
    setSave((previous) => {
      let next = updater(previous);
      const unlocked = newlyUnlocked(next);
      if (unlocked.length > 0) {
        next = { ...next, ach: [...next.ach, ...unlocked] };
      }
      next = { ...next, v: SAVE_VERSION, lastSeen: Date.now() };
      saveIdleSave(next);
      saveRef.current = next;
      return next;
    });
  }, []);

  // ------------------------------------------------------------ production loop
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let accumulated = 0;

    const tick = (now: number) => {
      const dt = Math.min(5, (now - last) / 1000);
      last = now;

      const rate = production(saveRef.current);
      if (rate > 0) {
        accumulated += rate * dt;
        while (accumulated >= 1) {
          const gain = Math.floor(accumulated);
          accumulated -= gain;
          setSave((previous) => {
            const next: IdleSave = {
              ...previous,
              crystals: previous.crystals + gain,
              total: previous.total + gain,
              allTime: Math.max(previous.allTime, previous.total + gain),
              best: Math.max(previous.best, previous.crystals + gain),
            };
            saveRef.current = next;
            return next;
          });
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // ------------------------------------------------------------ mandor otomatis
  useEffect(() => {
    if (!save.auto) return;

    const timer = window.setInterval(() => {
      setSave((previous) => {
        let next = previous;
        // beberapa pembelian per tick supaya tidak tertinggal saat laju tinggi
        const steps = autoBuysPerTick(previous);
        for (let i = 0; i < steps; i++) {
          // riset dulu, baru generator: kalau tidak, kristal habis untuk tier
          const stepped = autoUpgradeStep(next) ?? autoBuyStep(next);
          if (!stepped) break;
          next = stepped;
        }
        if (next === previous) return previous;
        const unlocked = newlyUnlocked(next);
        if (unlocked.length > 0) next = { ...next, ach: [...next.ach, ...unlocked] };
        saveRef.current = next;
        return next;
      });
    }, 500);

    return () => window.clearInterval(timer);
  }, [save.auto, save.perm.autobuy]);

  // ------------------------------------------------------------ periodic save
  useEffect(() => {
    const persist = () => {
      saveIdleSave(saveRef.current);
      setSaveStatus(`tersimpan ${new Date().toLocaleTimeString("id-ID")}`);
    };
    const timer = window.setInterval(persist, 3000);
    persist();
    const onHide = () => {
      if (document.visibilityState === "hidden") saveIdleSave(saveRef.current);
    };
    const onPageHide = () => saveIdleSave(saveRef.current);

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // ------------------------------------------------------------ achievement toast
  useEffect(() => {
    const added = save.ach.filter((id) => !knownAch.current.includes(id));
    knownAch.current = save.ach;
    if (added.length === 0) return;
    const names = added
      .map((id) => ACHIEVEMENTS.find((achievement) => achievement.id === id)?.name)
      .filter(Boolean);
    if (names.length > 0) notify(`Pencapaian: ${names.join(", ")}`);
  }, [save.ach, notify]);

  // ------------------------------------------------------------ toast timer
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // ------------------------------------------------------------ actions
  const tap = useCallback(() => {
    commit((current) => {
      const gain = clickGain(current);
      return {
        ...current,
        crystals: current.crystals + gain,
        total: current.total + gain,
        allTime: Math.max(current.allTime, current.total + gain),
        clicks: current.clicks + 1,
        best: Math.max(current.best, current.crystals + gain),
      };
    });
  }, [commit]);

  const buy = useCallback(
    (generatorId: string) => {
      const generator = GENERATORS.find((item) => item.id === generatorId);
      if (!generator) return;

      const current = saveRef.current;
      const quantity = wantedCount(current, generator);
      if (quantity <= 0) {
        notify(`Kristal belum cukup untuk ${generator.name}`);
        return;
      }
      const cost = bulkCost(generator, current.gens[generator.id] ?? 0, quantity);
      if (cost > current.crystals) {
        notify(`Kristal belum cukup untuk ${generator.name}`);
        return;
      }

      commit((state) => ({
        ...state,
        crystals: state.crystals - cost,
        gens: { ...state.gens, [generator.id]: (state.gens[generator.id] ?? 0) + quantity },
      }));
    },
    [commit, notify],
  );

  const buyRunUpgrade = useCallback(
    (id: UpgradeId) => {
      const current = saveRef.current;
      const def = RUN_UPGRADES.find((upgrade) => upgrade.id === id);
      if (!def) return;
      const level = current.upg[id];
      if (level >= def.max) return;

      const cost = runUpgradeCost(id, level);
      if (cost > current.crystals) {
        notify(`Kristal belum cukup untuk ${def.name}`);
        return;
      }

      commit((state) => ({
        ...state,
        crystals: state.crystals - cost,
        upg: { ...state.upg, [id]: state.upg[id] + 1 },
      }));
    },
    [commit, notify],
  );

  const buyCoreUpgrade = useCallback(
    (id: PermId) => {
      const current = saveRef.current;
      const def = CORE_UPGRADES.find((upgrade) => upgrade.id === id);
      if (!def) return;
      const level = current.perm[id];
      const cost = coreUpgradeCost(id, level);
      if (cost === null) return;
      if (cost > current.cores) {
        notify(`Inti belum cukup untuk ${def.name}`);
        return;
      }

      commit((state) => ({
        ...state,
        cores: state.cores - cost,
        perm: { ...state.perm, [id]: state.perm[id] + 1 },
      }));
      notify(`${def.name} naik ke level ${level + 1}`);
    },
    [commit, notify],
  );

  const buyClickUpgrade = useCallback(() => {
    const current = saveRef.current;
    const cost = clickUpgradeCost(current.clickLevel);
    if (cost > current.crystals) {
      notify("Kristal belum cukup untuk upgrade klik");
      return;
    }
    commit((state) => ({
      ...state,
      crystals: state.crystals - cost,
      clickLevel: state.clickLevel + 1,
    }));
  }, [commit, notify]);

  const setBuy = useCallback(
    (amount: BuyAmount) => {
      commit((current) => ({ ...current, buy: amount }));
    },
    [commit],
  );

  const setAuto = useCallback(
    (enabled: boolean) => {
      commit((state) => ({ ...state, auto: enabled }));
    },
    [commit],
  );

  const runPrestige = useCallback(() => {
    const current = saveRef.current;
    if (!canPrestige(current)) {
      notify("Belum cukup: butuh total 1 juta kristal dalam satu putaran");
      return;
    }
    const gain = coreGain(current.total);
    const next = prestige(current);
    saveIdleSave(next);
    saveRef.current = next;
    setSave(next);
    notify(`Peleburan selesai: +${gain} inti permanen`);
  }, [notify]);

  const reset = useCallback(() => {
    if (
      !window.confirm(
        "Reset total (kristal, inti, generator, riset, pencapaian)? Tindakan ini tidak bisa dibatalkan.",
      )
    ) {
      return;
    }
    const fresh = defaultSave();
    saveIdleSave(fresh);
    saveRef.current = fresh;
    knownAch.current = fresh.ach;
    setSave(fresh);
    notify("Progres direset. Mulai dari nol.");
  }, [notify]);

  const dismissOffline = useCallback(() => setOffline(null), []);

  return {
    save,
    offline,
    toast,
    saveStatus,
    tap,
    buy,
    buyRunUpgrade,
    buyCoreUpgrade,
    buyClickUpgrade,
    setBuy,
    setAuto,
    runPrestige,
    reset,
    dismissOffline,
  };
}
