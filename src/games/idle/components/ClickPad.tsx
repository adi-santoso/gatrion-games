import { useRef, useState, type MouseEvent } from "react";
import { formatNumber } from "../../../lib/format";

interface Pop {
  id: number;
  x: number;
  y: number;
  text: string;
}

interface Props {
  gain: number;
  tierId: string;
  tierName: string;
  onTap: () => void;
}

export function ClickPad({ gain, tierId, tierName, onTap }: Props) {
  const [pops, setPops] = useState<Pop[]>([]);
  const nextId = useRef(0);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onTap();
    const rect = event.currentTarget.parentElement?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
    const id = nextId.current++;
    const pop: Pop = {
      id,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      text: `+${formatNumber(gain)}`,
    };
    setPops((previous) => [...previous, pop]);
    window.setTimeout(() => {
      setPops((previous) => previous.filter((item) => item.id !== id));
    }, 800);
  };

  return (
    <div className="mine-scene" aria-label="Area tambang kristal">
      <div className="mine-scene-stars" aria-hidden="true" />
      <div className="mine-scene-ridge mine-scene-ridge-back" aria-hidden="true" />
      <div className="mine-scene-ridge mine-scene-ridge-front" aria-hidden="true" />
      <div className="mine-scene-label">
        <span className="mine-scene-live"><span /> AREA TAMBANG</span>
        <span className="mine-scene-sector">SEKTOR 01 · KEDALAMAN AKTIF</span>
      </div>
      <div id="pop-layer" className="mine-crystal-wrap">
        <span className="mine-orbit mine-orbit-one" aria-hidden="true" />
        <span className="mine-orbit mine-orbit-two" aria-hidden="true" />
        <button
          type="button"
          className="mine-crystal"
          aria-label={`Ketuk untuk kristal (bonus +${formatNumber(gain)})`}
          onClick={handleClick}
        >
          <span className="mine-crystal-glow" aria-hidden="true" />
          <img
            className="core-icon"
            src={`/icons/idle/${tierId}.png`}
            alt=""
            width={64}
            height={64}
            decoding="async"
          />
          <span className="core-tier">{tierName}</span>
          <span className="core-bonus">+{formatNumber(gain)} <small>KRISTAL / KETUK</small></span>
        </button>
        {pops.map((pop) => (
          <span key={pop.id} className="pop-float" style={{ left: pop.x, top: pop.y }}>
            {pop.text}
          </span>
        ))}
      </div>
      <div className="mine-scene-footer">
        <span><i aria-hidden="true" /> INTI KRISTAL</span>
        <span>KETUK UNTUK MENAMBANG</span>
      </div>
    </div>
  );
}
