interface GlyphProps {
  className?: string;
}

function Glyph({ children, className }: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function CrystalGlyph({ className }: GlyphProps) {
  return (
    <Glyph className={className}>
      <path d="M12 3 L19 9 L12 21 L5 9 Z" />
      <path d="M5 9 H19 M12 3 L9 9 L12 21 M12 3 L15 9" />
    </Glyph>
  );
}

export function CoreGlyph({ className }: GlyphProps) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.4 L15.4 12 L12 16.6 L8.6 12 Z" />
    </Glyph>
  );
}

export function HelmetGlyph({ className }: GlyphProps) {
  return (
    <Glyph className={className}>
      <path d="M4.2 15.5 a7.8 7.8 0 0 1 15.6 0" />
      <path d="M2.8 15.5 H21.2" />
      <path d="M12 7.7 V15.5" />
      <circle cx="15.6" cy="9.4" r="1.9" />
    </Glyph>
  );
}

export function FlaskGlyph({ className }: GlyphProps) {
  return (
    <Glyph className={className}>
      <path d="M9 3 h6 M10 3 v6 L5.4 18.4 A2 2 0 0 0 7.2 21 h9.6 a2 2 0 0 0 1.8 -2.6 L14 9 V3" />
      <path d="M7.6 15.4 h8.8" />
    </Glyph>
  );
}

export function LockGlyph({ className }: GlyphProps) {
  return (
    <Glyph className={className}>
      <rect x="4.8" y="10.8" width="14.4" height="9.4" rx="2.2" />
      <path d="M8.2 10.8 V8.2 a3.8 3.8 0 0 1 7.6 0 v2.6" />
    </Glyph>
  );
}
