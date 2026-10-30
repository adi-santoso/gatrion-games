interface GlyphProps {
  className?: string;
}

const base = {
  "aria-hidden": true,
  focusable: "false",
  viewBox: "0 0 64 64",
} as const;

/** Kristal lime khas gatrion. */
export function GatrionGlyph({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <path d="M32 9 47 30 32 55 17 30Z" fill="#c8f36a" />
      <path d="M32 9 47 30H32Z" fill="#eaffb0" />
      <path d="M32 30h15L32 55Z" fill="#8fbe2f" />
      <path d="M17 30h15v25Z" fill="#a9d94a" opacity=".55" />
      <path d="M17 30 32 9l-4 21Z" fill="#f4ffd2" opacity=".8" />
    </svg>
  );
}

/** Tiga kotak huruf dengan warna Wordle. */
export function WordleGlyph({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <g stroke="#10140c" strokeWidth="2">
        <rect x="12" y="12" width="16" height="16" rx="4" fill="#c8f36a" />
        <rect x="34" y="12" width="16" height="16" rx="4" fill="#f0c778" />
        <rect x="12" y="34" width="16" height="16" rx="4" fill="#e7efd8" opacity=".35" />
        <rect x="34" y="34" width="16" height="16" rx="4" fill="#c8f36a" />
      </g>
    </svg>
  );
}

/** Ular melingkar: ekor redup, kepala lime dengan mata gelap. */
export function SnakeGlyph({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <g stroke="#10140c" strokeWidth="2">
        <rect x="10" y="10" width="17" height="17" rx="5" fill="#6f9f2e" />
        <rect x="27" y="10" width="17" height="17" rx="5" fill="#8bbd38" />
        <rect x="27" y="27" width="17" height="17" rx="5" fill="#a9d94a" />
        <rect x="44" y="27" width="13" height="17" rx="5" fill="#c8f36a" />
      </g>
      <circle cx="50" cy="33" r="1.9" fill="#10140c" />
      <circle cx="50" cy="39" r="1.9" fill="#10140c" />
    </svg>
  );
}

export function SettingsGlyph({ className }: GlyphProps) {
  return (
    <svg {...base} className={className} fill="none">
      <path
        d="M32 12.5a5 5 0 0 1 4.7 3.3l1 2.6 2.7.8 2.5-1.4a5 5 0 0 1 6.2 1l1.6 1.6a5 5 0 0 1 1 6.2l-1.4 2.5.8 2.7 2.6 1a5 5 0 0 1 0 9.4l-2.6 1-.8 2.7 1.4 2.5a5 5 0 0 1-1 6.2l-1.6 1.6a5 5 0 0 1-6.2 1l-2.5-1.4-2.7.8-1 2.6a5 5 0 0 1-9.4 0l-1-2.6-2.7-.8-2.5 1.4a5 5 0 0 1-6.2-1l-1.6-1.6a5 5 0 0 1-1-6.2l1.4-2.5-.8-2.7-2.6-1a5 5 0 0 1 0-9.4l2.6-1 .8-2.7-1.4-2.5a5 5 0 0 1 1-6.2l1.6-1.6a5 5 0 0 1 6.2-1l2.5 1.4 2.7-.8 1-2.6A5 5 0 0 1 32 12.5Z"
        transform="scale(0.82) translate(7 7)"
        stroke="#f4f5ef"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="6.5" stroke="#f4f5ef" strokeWidth="3.4" />
    </svg>
  );
}

/** Launchpad: kisi 3x3 seperti macOS. */
export function LaunchpadGlyph({ className }: GlyphProps) {
  const fills = [
    "#ff6b6b",
    "#ffb45c",
    "#ffd93d",
    "#7bd88f",
    "#4ecdc4",
    "#5aa9ff",
    "#a78bfa",
    "#ff8fab",
    "#b9c3d1",
  ];
  return (
    <svg {...base} className={className}>
      {fills.map((fill, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        return (
          <rect
            key={fill}
            x={10 + column * 16}
            y={10 + row * 16}
            width="12"
            height="12"
            rx="3.4"
            fill={fill}
          />
        );
      })}
    </svg>
  );
}

export function SearchGlyph({ className }: GlyphProps) {
  return (
    <svg {...base} className={className} fill="none">
      <circle cx="28" cy="28" r="13" stroke="currentColor" strokeWidth="4" />
      <path d="M38 38 51 51" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function WifiGlyph({ className, offline = false }: GlyphProps & { offline?: boolean }) {
  return (
    <svg {...base} className={className} viewBox="0 0 24 18" fill="none">
      <path
        d="M2 5.4a15 15 0 0 1 20 0M4.6 8.6a11.4 11.4 0 0 1 14.8 0M7.4 11.8a7.4 7.4 0 0 1 9.2 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15" r="1.7" fill="currentColor" />
      {offline && <path d="M2 16 22 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />}
    </svg>
  );
}

export function BatteryGlyph({ className, level }: GlyphProps & { level: number }) {
  const width = Math.max(2, Math.round(15 * level));
  return (
    <svg {...base} className={className} viewBox="0 0 26 14" fill="none">
      <rect x="1" y="2" width="21" height="10" rx="3" stroke="currentColor" strokeWidth="1.4" opacity=".65" />
      <rect x="3" y="4" width={width} height="6" rx="1.6" fill="currentColor" />
      <path d="M24 5.4v3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".65" />
    </svg>
  );
}

export function ControlCenterGlyph({ className }: GlyphProps) {
  return (
    <svg {...base} className={className} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" opacity=".5" />
      <circle cx="8.5" cy="8.5" r="2.1" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="2.1" fill="currentColor" />
      <path d="M13 8.5h4M7 15.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ClockGlyph({ className }: GlyphProps) {
  return (
    <svg {...base} className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5.2l3.4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckGlyph({ className }: GlyphProps) {
  return (
    <svg {...base} className={className} viewBox="0 0 24 24" fill="none">
      <path d="m5 12.8 4.6 4.6L19.4 6.6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseGlyph({ className }: GlyphProps) {
  return (
    <svg {...base} className={className} viewBox="0 0 24 24" fill="none">
      <path d="m6.5 6.5 11 11m0-11-11 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function MinusGlyph({ className }: GlyphProps) {
  return (
    <svg {...base} className={className} viewBox="0 0 24 24" fill="none">
      <path d="M5.5 12h13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function ExpandGlyph({ className }: GlyphProps) {
  return (
    <svg {...base} className={className} viewBox="0 0 24 24" fill="none">
      <path d="M6 9V6h3M18 15v3h-3M6 15v3h3M18 9V6h-3" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 9.5h5v5h-5z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
    </svg>
  );
}
