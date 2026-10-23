import type { AppDefinition } from "../apps";

interface Props {
  items: AppDefinition[];
  index: number;
}

export function AppSwitcher({ items, index }: Props) {
  if (items.length === 0) return null;
  const active = items[Math.min(index, items.length - 1)];

  return (
    <div className="mac-switcher" role="dialog" aria-label="Pindah aplikasi" aria-live="polite">
      <div className="mac-switcher-strip">
        {items.map((app, position) => (
          <span
            key={app.id}
            className="mac-switcher-icon"
            data-app={app.id}
            data-active={position === index ? "true" : "false"}
          >
            {app.icon}
          </span>
        ))}
      </div>
      <p className="mac-switcher-name">{active?.name}</p>
      <p className="mac-switcher-hint">lepas ⌘ untuk pindah · esc untuk batal</p>
    </div>
  );
}
