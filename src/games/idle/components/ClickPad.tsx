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
    const rect = event.currentTarget.getBoundingClientRect();
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
    <div id="pop-layer" className="relative mx-auto w-fit">
      <button
        type="button"
        className="core"
        aria-label={`Ketuk untuk kristal (bonus +${formatNumber(gain)})`}
        onClick={handleClick}
      >
        <img
          className="core-icon"
          src={`/icons/idle/${tierId}.png`}
          alt=""
          width={64}
          height={64}
          decoding="async"
        />
        <span className="core-tier">{tierName}</span>
        <span className="core-bonus">+{formatNumber(gain)}</span>
      </button>
      {pops.map((pop) => (
        <span key={pop.id} className="pop-float" style={{ left: pop.x, top: pop.y }}>
          {pop.text}
        </span>
      ))}
    </div>
  );
}
