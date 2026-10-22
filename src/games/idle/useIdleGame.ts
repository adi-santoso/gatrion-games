import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ACHIEVEMENTS,
  CORE_UPGRADES,
  DAILY_MISSIONS,
  GENERATORS,
  MATERIAL_IDS,
  MATERIAL_UPGRADE_MAX,
  RUN_UPGRADES,
  RECRUITS,
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
  ensureDailyMissionDate,
  addDailyMissionProgress,
  emptyMaterialBag,
  materialBuildingAffordableCount,
  materialBuildingBulkCost,
  materialRates,
  materialUpgradeCost,
  newlyUnlocked,
  offlineReport,
  prestige,
  production,
  runUpgradeCost,
  wantedCount,
} from "./economy";
import { loadIdleSave, saveIdleSave } from "./storage";
import type { BuyAmount, DailyMissionId, IdleSave, MaterialId, OfflineReport, PermId, RecruitId, UpgradeId } from "./types";

export interface IdleToast {
  id: number;
  text: string;
}

export function useIdleGame() {
  const initial = useMemo(() => {
    const loaded = ensureDailyMissionDate(loadIdleSave());
    const report = offlineReport(loaded);

    const hasMaterialGain = MATERIAL_IDS.some((id) => report.materials[id] > 0);
    const hasOfflineGain = report.gain >= 1 || hasMaterialGain;
    let base: IdleSave = !hasOfflineGain
      ? loaded
      : {
            ...loaded,
            crystals: loaded.crystals + report.gain,
            total: loaded.total + report.gain,
            allTime: Math.max(loaded.allTime, loaded.total + report.gain),
            best: Math.max(loaded.best, loaded.crystals + report.gain),
            materials: {
              wood: loaded.materials.wood + report.materials.wood,
              stone: loaded.materials.stone + report.materials.stone,
              herb: loaded.materials.herb + report.materials.herb,
            },
            ach: loaded.ach.includes("offline") ? loaded.ach : [...loaded.ach, "offline"],
            lastSeen: Date.now(),
          };
    if (hasOfflineGain && report.gain > 0) base = addDailyMissionProgress(base, "crystals", report.gain);

    // pencapaian yang sebenarnya sudah terpenuhi tapi belum tercatat
    const unlocked = newlyUnlocked(base);
    const save =
      unlocked.length > 0 ? { ...base, ach: [...base.ach, ...unlocked] } : base;

    return { save, report: hasOfflineGain ? report : null };
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
      let next = ensureDailyMissionDate(updater(previous));
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
    let materialElapsed = 0;
    const accruedMaterials = emptyMaterialBag();

    const tick = (now: number) => {
      const dt = Math.min(5, (now - last) / 1000);
      last = now;

      const current = saveRef.current;
      const rate = production(current);
      if (rate > 0) {
        accumulated += rate * dt;
        while (accumulated >= 1) {
          const gain = Math.floor(accumulated);
          accumulated -= gain;
          setSave((previous) => {
            let next: IdleSave = {
              ...previous,
              crystals: previous.crystals + gain,
              total: previous.total + gain,
              allTime: Math.max(previous.allTime, previous.total + gain),
              best: Math.max(previous.best, previous.crystals + gain),
            };
            next = addDailyMissionProgress(next, "crystals", gain);
            next = { ...next, v: SAVE_VERSION };
            saveIdleSave(next);
            saveRef.current = next;
            return next;
          });
        }
      }

      const rates = materialRates(current);
      for (const id of MATERIAL_IDS) accruedMaterials[id] += rates[id] * dt;
      materialElapsed += dt;
      if (materialElapsed >= 1 && MATERIAL_IDS.some((id) => accruedMaterials[id] > 0)) {
        const gain = { ...accruedMaterials };
        for (const id of MATERIAL_IDS) accruedMaterials[id] = 0;
        materialElapsed = 0;
        setSave((previous) => {
          const next: IdleSave = {
            ...previous,
            materials: {
              wood: previous.materials.wood + gain.wood,
              stone: previous.materials.stone + gain.stone,
              herb: previous.materials.herb + gain.herb,
            },
          };
          saveRef.current = next;
          return next;
        });
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
        let next = ensureDailyMissionDate(previous);
        // beberapa pembelian per tick supaya tidak tertinggal saat laju tinggi
        const steps = autoBuysPerTick(previous);
        for (let i = 0; i < steps; i++) {
          // riset dulu, baru generator: kalau tidak, kristal habis untuk tier
          const stepped = autoUpgradeStep(next) ?? autoBuyStep(next);
          if (!stepped) break;
          next = stepped;
        }
        const purchased = Math.max(0, next.autoBuys - previous.autoBuys);
        if (purchased > 0) next = addDailyMissionProgress(next, "buildings", purchased);
        if (next === previous) return previous;
        const unlocked = newlyUnlocked(next);
        if (unlocked.length > 0) next = { ...next, ach: [...next.ach, ...unlocked] };
        saveRef.current = next;
        return next;
      });
    }, 500);

    return () => window.clearInterval(timer);
  }, [save.auto, save.perm.autobuy, save.crew.engineer]);

  // Local date rollover is applied even while the tab stays open.
  useEffect(() => {
    const rollDate = () => {
      const current = saveRef.current;
      const next = ensureDailyMissionDate(current);
      if (next === current) return;
      next.lastSeen = Date.now();
      next.v = SAVE_VERSION;
      saveRef.current = next;
      setSave(next);
      saveIdleSave(next);
    };
    const timer = window.setInterval(rollDate, 30_000);
    return () => window.clearInterval(timer);
  }, []);

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
      return addDailyMissionProgress(addDailyMissionProgress({
        ...current,
        crystals: current.crystals + gain,
        total: current.total + gain,
        allTime: Math.max(current.allTime, current.total + gain),
        clicks: current.clicks + 1,
        best: Math.max(current.best, current.crystals + gain),
      }, "crystals", gain), "taps", 1);
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

      commit((state) => addDailyMissionProgress({
        ...state,
        crystals: state.crystals - cost,
        gens: { ...state.gens, [generator.id]: (state.gens[generator.id] ?? 0) + quantity },
      }, "buildings", quantity));
    },
    [commit, notify],
  );

  const buyMaterialBuilding = useCallback(
    (id: MaterialId) => {
      const current = saveRef.current;
      const quantity = current.buy === "max"
        ? materialBuildingAffordableCount(current, id)
        : Number(current.buy);
      if (quantity <= 0) {
        notify("Kristal belum cukup untuk bangunan material");
        return;
      }
      const cost = materialBuildingBulkCost(id, current.materialBuildings[id], quantity);
      if (cost > current.crystals) {
        notify("Kristal belum cukup untuk bangunan material");
        return;
      }
      commit((state) => addDailyMissionProgress({
        ...state,
        crystals: state.crystals - cost,
        materialBuildings: {
          ...state.materialBuildings,
          [id]: state.materialBuildings[id] + quantity,
        },
      }, "buildings", quantity));
    },
    [commit, notify],
  );

  const buyMaterialUpgrade = useCallback(
    (id: MaterialId) => {
      const current = saveRef.current;
      const level = current.materialUpgrades[id];
      if (current.materialBuildings[id] <= 0) {
        notify("Bangun sumber material lebih dulu");
        return;
      }
      if (level >= MATERIAL_UPGRADE_MAX) return;
      const cost = materialUpgradeCost(id, level);
      if (current.materials[id] < cost) {
        notify(`Material ${id} belum cukup`);
        return;
      }
      commit((state) => ({
        ...state,
        materials: { ...state.materials, [id]: state.materials[id] - cost },
        materialUpgrades: { ...state.materialUpgrades, [id]: state.materialUpgrades[id] + 1 },
      }));
      notify(`Peningkatan material naik ke level ${level + 1}`);
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

  const claimDailyMission = useCallback((id: DailyMissionId) => {
    const mission = DAILY_MISSIONS.find((item) => item.id === id);
    if (!mission) return;
    const current = ensureDailyMissionDate(saveRef.current);
    if (current.dailyMissions.claimed.includes(id) || current.dailyMissions.progress[id] < mission.target) return;
    commit((state) => ({
      ...state,
      crystals: state.crystals + mission.reward,
      dailyMissions: { ...state.dailyMissions, claimed: [...state.dailyMissions.claimed, id] },
    }));
    notify(`Misi selesai: +${mission.reward} kristal`);
  }, [commit, notify]);

  const recruit = useCallback((id: RecruitId) => {
    const def = RECRUITS.find((item) => item.id === id);
    if (!def) return;
    const current = saveRef.current;
    if (current.crew[id]) return;
    const costs = Object.entries(def.cost) as Array<[MaterialId, number]>;
    const source = costs[0]?.[0];
    if (!source || current.materialBuildings[source] <= 0) {
      notify("Bangun sumber material lebih dulu");
      return;
    }
    if (costs.some(([material, amount]) => current.materials[material] < amount)) {
      notify("Material belum cukup untuk merekrut");
      return;
    }
    commit((state) => ({
      ...state,
      materials: costs.reduce((materials, [material, amount]) => ({
        ...materials,
        [material]: materials[material] - amount,
      }), state.materials),
      crew: { ...state.crew, [id]: true },
    }));
    notify(`${def.name} bergabung dengan kru`);
  }, [commit, notify]);

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
    buyMaterialBuilding,
    buyMaterialUpgrade,
    buyRunUpgrade,
    buyCoreUpgrade,
    buyClickUpgrade,
    setBuy,
    setAuto,
    claimDailyMission,
    recruit,
    runPrestige,
    reset,
    dismissOffline,
  };
}
