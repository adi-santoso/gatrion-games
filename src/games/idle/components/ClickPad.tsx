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
  onTap: () => void;
}

export function ClickPad({ gain, onTap }: Props) {
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
    <div id="pop-layer" className="relative mt-7 overflow-hidden rounded-[10px]">
      <button type="button" className="pad" onClick={handleClick}>
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted">tap / klik</span>
        <span className="display text-xl">Tambang kristal</span>
      </button>
      {pops.map((pop) => (
        <span key={pop.id} className="pop-float" style={{ left: pop.x, top: pop.y }}>
          {pop.text}
        </span>
      ))}
    </div>
  );
}
