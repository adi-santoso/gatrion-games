import { useEffect, useRef, useState } from "react";
import type { AppDefinition } from "../apps";
import type { DesktopPrefs } from "../context";
import { setTheme, toggleTheme, type Theme } from "../../lib/theme";
import { Switch } from "../../components/Switch";
import type { AppId, DockSize, WindowState } from "../types";
import {
  BatteryGlyph,
  CheckGlyph,
  ControlCenterGlyph,
  GatrionGlyph,
  SearchGlyph,
  WifiGlyph,
} from "./icons";

interface MenuItem {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  separator?: boolean;
  onSelect?: () => void;
}

interface MenuGroup {
  id: string;
  title: string;
  items: MenuItem[];
}

interface Props {
  activeApp: AppDefinition;
  windows: WindowState[];
  focusedId: string | null;
  theme: Theme;
  prefs: DesktopPrefs;
  onNewWindow: () => void;
  onCloseWindow: () => void;
  onCloseAll: () => void;
  onMinimizeWindow: () => void;
  onToggleZoom: () => void;
  onBringAll: () => void;
  onFocusWindow: (id: string) => void;
  onOpenSpotlight: () => void;
  onOpenMissionControl: () => void;
  onAbout: () => void;
  onOpenSettings: () => void;
  onMinimizeApp: () => void;
  onMinimizeOthers: () => void;
  onHideAll: () => void;
  onShowAll: () => void;
  onQuitApp: () => void;
  onResetLayout: () => void;
  onSetDockSize: (size: DockSize) => void;
  onSetReduceMotion: (value: boolean) => void;
  appById: (id: AppId) => AppDefinition;
}

function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

interface BatteryLike extends EventTarget {
  level: number;
}

function useBatteryLevel(): number | null {
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    const navigatorWithBattery = navigator as Navigator & {
      getBattery?: () => Promise<BatteryLike>;
    };
    if (typeof navigatorWithBattery.getBattery !== "function") return;

    let battery: BatteryLike | null = null;
    let cancelled = false;
    const update = () => {
      if (battery && !cancelled) setLevel(battery.level);
    };

    navigatorWithBattery
      .getBattery()
      .then((result) => {
        if (cancelled) return;
        battery = result;
        update();
        battery.addEventListener("levelchange", update);
      })
      .catch(() => setLevel(null));

    return () => {
      cancelled = true;
      battery?.removeEventListener("levelchange", update);
    };
  }, []);

  return level;
}

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function CalendarPopover({ now }: { now: Date }) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const cells: Array<number | null> = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="mac-popover mac-calendar">
      <header>
        <span>{now.toLocaleDateString("id-ID", { weekday: "long" })}</span>
        <strong>{now.toLocaleDateString("id-ID", { day: "numeric", month: "long" })}</strong>
      </header>
      <p className="mac-calendar-month">
        {now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
      </p>
      <div className="mac-calendar-grid" role="grid" aria-label="Kalender bulan ini">
        {WEEKDAYS.map((day) => (
          <span key={day} className="mac-calendar-weekday" role="columnheader">
            {day.slice(0, 1)}
          </span>
        ))}
        {cells.map((day, index) => (
          <span
            key={index}
            role="gridcell"
            className="mac-calendar-day"
            data-today={day === today ? "true" : undefined}
          >
            {day ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MenuBar({
  activeApp,
  windows,
  focusedId,
  theme,
  prefs,
  onNewWindow,
  onCloseWindow,
  onCloseAll,
  onMinimizeWindow,
  onToggleZoom,
  onBringAll,
  onFocusWindow,
  onOpenSpotlight,
  onOpenMissionControl,
  onAbout,
  onOpenSettings,
  onMinimizeApp,
  onMinimizeOthers,
  onHideAll,
  onShowAll,
  onQuitApp,
  onResetLayout,
  onSetDockSize,
  onSetReduceMotion,
  appById,
}: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [popover, setPopover] = useState<"control" | "clock" | null>(null);
  const root = useRef<HTMLElement | null>(null);
  const now = useClock();
  const online = useOnline();
  const battery = useBatteryLevel();

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpenMenu(null);
        setPopover(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setPopover(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const close = () => {
    setOpenMenu(null);
    setPopover(null);
  };

  const run = (action?: () => void) => {
    close();
    action?.();
  };

  const hasWindow = Boolean(focusedId);

  const menus: MenuGroup[] = [
    {
      id: "system",
      title: "",
      items: [
        { label: "Tentang Gatrion", onSelect: onAbout },
        { label: "Pengaturan Sistem…", onSelect: onOpenSettings },
        { label: "", separator: true },
        { label: "Sembunyikan Semua", onSelect: onHideAll, disabled: windows.length === 0 },
        { label: "Tampilkan Semua", onSelect: onShowAll, disabled: windows.length === 0 },
        { label: "", separator: true },
        { label: "Atur Ulang Tata Letak", onSelect: onResetLayout },
        { label: "Tutup Semua Jendela", onSelect: onCloseAll, disabled: windows.length === 0 },
      ],
    },
    {
      id: "app",
      title: activeApp.shortName,
      items: [
        { label: `Tentang ${activeApp.name}`, onSelect: onAbout },
        { label: "Pengaturan…", shortcut: "⌘,", onSelect: onOpenSettings },
        { label: "", separator: true },
        { label: `Sembunyikan ${activeApp.shortName}`, onSelect: onMinimizeApp },
        { label: "Sembunyikan Lainnya", onSelect: onMinimizeOthers },
        { label: "", separator: true },
        { label: `Keluar ${activeApp.shortName}`, shortcut: "⌘Q", onSelect: onQuitApp },
      ],
    },
    {
      id: "file",
      title: "Berkas",
      items: [
        { label: "Jendela Baru", shortcut: "⌘N", onSelect: onNewWindow },
        { label: "Tutup Jendela", shortcut: "⌘W", onSelect: onCloseWindow, disabled: !hasWindow },
        { label: "", separator: true },
        { label: "Tutup Semua Jendela", onSelect: onCloseAll, disabled: windows.length === 0 },
      ],
    },
    {
      id: "view",
      title: "Tampilan",
      items: [
        {
          label: "Mode Terang",
          checked: theme === "light",
          onSelect: () => setTheme("light"),
        },
        {
          label: "Mode Gelap",
          checked: theme === "dark",
          onSelect: () => setTheme("dark"),
        },
        { label: "", separator: true },
        { label: "Perbesar Jendela", onSelect: onToggleZoom, disabled: !hasWindow },
        { label: "Mission Control", shortcut: "⌃↑", onSelect: onOpenMissionControl },
        { label: "", separator: true },
        { label: "Atur Ulang Tata Letak", onSelect: onResetLayout },
      ],
    },
    {
      id: "window",
      title: "Jendela",
      items: [
        { label: "Minimalkan", shortcut: "⌘M", onSelect: onMinimizeWindow, disabled: !hasWindow },
        { label: "Bawa Semua ke Depan", onSelect: onBringAll, disabled: windows.length === 0 },
        { label: "", separator: true },
        ...windows
          .slice()
          .sort((a, b) => b.z - a.z)
          .slice(0, 6)
          .map((win) => ({
            label: appById(win.appId).name,
            checked: win.id === focusedId,
            onSelect: () => onFocusWindow(win.id),
          })),
      ],
    },
    {
      id: "help",
      title: "Bantuan",
      items: [
        { label: "Pintasan Papan Ketik", onSelect: onAbout },
        { label: "Cari Aplikasi…", shortcut: "⌘Space", onSelect: onOpenSpotlight },
        { label: "Mission Control", shortcut: "⌃↑", onSelect: onOpenMissionControl },
      ],
    },
  ];

  return (
    <header className="mac-menubar" aria-label="Menu bar" ref={root}>
      <div className="mac-menubar-left">
        <div className="mac-menu">
          <button
            type="button"
            className="mac-menubar-logo"
            aria-label="Menu Gatrion"
            aria-haspopup="true"
            aria-expanded={openMenu === "system"}
            onClick={() => setOpenMenu(openMenu === "system" ? null : "system")}
            onPointerEnter={() => openMenu && setOpenMenu("system")}
          >
            <GatrionGlyph />
          </button>
          {openMenu === "system" && <MenuList items={menus[0].items} onRun={run} />}
        </div>

        {menus.slice(1).map((menu) => (
          <div className="mac-menu" key={menu.id}>
            <button
              type="button"
              className="mac-menubar-item"
              data-app-title={menu.id === "app" ? "true" : undefined}
              aria-haspopup="true"
              aria-expanded={openMenu === menu.id}
              onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
              onPointerEnter={() => openMenu && setOpenMenu(menu.id)}
            >
              {menu.title}
            </button>
            {openMenu === menu.id && <MenuList items={menu.items} onRun={run} />}
          </div>
        ))}
      </div>

      <div className="mac-menubar-right">
        <button
          type="button"
          className="mac-status"
          aria-label="Spotlight"
          title="Spotlight (⌘Space)"
          onClick={onOpenSpotlight}
        >
          <SearchGlyph />
        </button>
        <button
          type="button"
          className="mac-status"
          aria-label="Pusat Kendali"
          aria-haspopup="true"
          aria-expanded={popover === "control"}
          onClick={() => {
            setOpenMenu(null);
            setPopover(popover === "control" ? null : "control");
          }}
        >
          <ControlCenterGlyph />
        </button>
        <span className="mac-status" title={online ? "Terhubung" : "Luring"} aria-hidden="true">
          <WifiGlyph offline={!online} />
        </span>
        {battery !== null && (
          <span className="mac-status mac-status-battery" title={`Baterai ${Math.round(battery * 100)}%`} aria-hidden="true">
            <BatteryGlyph level={battery} />
          </span>
        )}
        <button
          type="button"
          className="mac-status mac-clock"
          aria-haspopup="true"
          aria-expanded={popover === "clock"}
          aria-label="Tanggal dan jam"
          onClick={() => {
            setOpenMenu(null);
            setPopover(popover === "clock" ? null : "clock");
          }}
        >
          <span>{now.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</span>
          <span>
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".")}
          </span>
        </button>

        {popover === "control" && (
          <div className="mac-popover mac-control">
            <section className="mac-control-row">
              <div>
                <strong>Tampilan</strong>
                <span>{theme === "dark" ? "Gelap" : "Terang"}</span>
              </div>
              <button
                type="button"
                className="mac-control-theme"
                aria-pressed={theme === "dark"}
                aria-label="Ganti mode warna"
                onClick={() => toggleTheme()}
              >
                {theme === "dark" ? "☾" : "☀"}
              </button>
            </section>

            <section className="mac-control-row">
              <div>
                <strong>Kurangi animasi</strong>
                <span>Transisi jendela dan dock</span>
              </div>
              <Switch
                checked={prefs.reduceMotion}
                onChange={onSetReduceMotion}
                label="Kurangi animasi"
              />
            </section>

            <section className="mac-control-block">
              <strong>Ukuran dock</strong>
              <div className="mac-control-seg" role="group" aria-label="Ukuran dock">
                {(["sm", "md", "lg"] as DockSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={prefs.dockSize === size}
                    onClick={() => onSetDockSize(size)}
                  >
                    {size === "sm" ? "S" : size === "md" ? "M" : "L"}
                  </button>
                ))}
              </div>
            </section>

            <section className="mac-control-actions">
              <button type="button" onClick={() => run(onOpenMissionControl)}>
                Mission Control
              </button>
              <button type="button" onClick={() => run(onOpenSettings)}>
                Pengaturan Sistem…
              </button>
              <button type="button" onClick={() => run(onResetLayout)}>
                Atur ulang tata letak
              </button>
            </section>
          </div>
        )}

        {popover === "clock" && <CalendarPopover now={now} />}
      </div>
    </header>
  );
}

function MenuList({ items, onRun }: { items: MenuItem[]; onRun: (action?: () => void) => void }) {
  return (
    <div className="mac-menu-list" role="menu">
      {items.map((item, index) => {
        if (item.separator) return <span key={`sep-${index}`} className="mac-menu-sep" role="separator" />;
        return (
          <button
            key={`${item.label}-${index}`}
            type="button"
            role="menuitem"
            className="mac-menu-item"
            disabled={item.disabled}
            onClick={() => onRun(item.onSelect)}
          >
            <span className="mac-menu-check" aria-hidden="true">
              {item.checked ? <CheckGlyph /> : null}
            </span>
            <span className="mac-menu-label">{item.label}</span>
            {item.shortcut && <span className="mac-menu-shortcut">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
