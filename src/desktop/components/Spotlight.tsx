import { useEffect, useMemo, useRef, useState } from "react";
import type { AppDefinition } from "../apps";
import type { AppId } from "../types";
import { SearchGlyph } from "./icons";

export interface SpotlightCommand {
  id: string;
  label: string;
  hint: string;
  keywords: string[];
  run: () => void;
}

interface Props {
  apps: AppDefinition[];
  commands: SpotlightCommand[];
  onOpenApp: (appId: AppId) => void;
  onClose: () => void;
}

type Result =
  | { kind: "app"; id: string; label: string; hint: string; app: AppDefinition }
  | { kind: "command"; id: string; label: string; hint: string; command: SpotlightCommand };

export function Spotlight({ apps, commands, onOpenApp, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const results = useMemo<Result[]>(() => {
    const needle = query.trim().toLowerCase();

    const appResults: Result[] = apps
      .filter((app) => {
        if (!needle) return true;
        return [app.name, app.shortName, app.tagline, ...app.keywords]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .map((app) => ({ kind: "app", id: `app-${app.id}`, label: app.name, hint: app.tagline, app }));

    const commandResults: Result[] = commands
      .filter((command) => {
        if (!needle) return false;
        return [command.label, ...command.keywords].join(" ").toLowerCase().includes(needle);
      })
      .map((command) => ({
        kind: "command",
        id: `cmd-${command.id}`,
        label: command.label,
        hint: command.hint,
        command,
      }));

    return [...appResults, ...commandResults].slice(0, 7);
  }, [apps, commands, query]);

  const active = results[Math.min(index, Math.max(0, results.length - 1))];

  const activate = (result: Result | undefined) => {
    if (!result) return;
    onClose();
    if (result.kind === "app") onOpenApp(result.app.id);
    else result.command.run();
  };

  return (
    <div className="mac-spotlight-backdrop" role="presentation" onPointerDown={onClose}>
      <div
        className="mac-spotlight"
        role="dialog"
        aria-modal="true"
        aria-label="Spotlight"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="mac-spotlight-field">
          <SearchGlyph />
          <input
            ref={input}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setIndex((previous) => (previous + 1) % Math.max(1, results.length));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setIndex((previous) => (previous - 1 + results.length) % Math.max(1, results.length));
              } else if (event.key === "Enter") {
                event.preventDefault();
                activate(active);
              } else if (event.key === "Escape") {
                event.preventDefault();
                onClose();
              }
            }}
            placeholder="Cari aplikasi atau perintah"
            aria-label="Cari aplikasi atau perintah"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="mac-spotlight-key">esc</kbd>
        </div>

        {results.length > 0 && (
          <ul className="mac-spotlight-list" role="listbox" aria-label="Hasil pencarian">
            {results.map((result, position) => (
              <li key={result.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={position === index}
                  data-active={position === index ? "true" : "false"}
                  onPointerEnter={() => setIndex(position)}
                  onClick={() => activate(result)}
                >
                  <span className="mac-spotlight-icon" data-app={result.kind === "app" ? result.app.id : "command"}>
                    {result.kind === "app" ? result.app.icon : <SearchGlyph />}
                  </span>
                  <span className="mac-spotlight-copy">
                    <strong>{result.label}</strong>
                    <small>{result.hint}</small>
                  </span>
                  <span className="mac-spotlight-kind">{result.kind === "app" ? "aplikasi" : "perintah"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {results.length === 0 && (
          <p className="mac-spotlight-empty">Tidak ada hasil untuk “{query}”.</p>
        )}
      </div>
    </div>
  );
}
