"use client";

import { useMemo } from "react";

type Props = {
  count?: number;
  seed?: number;
};

export default function Waveform({ count = 38, seed = 1 }: Props) {
  const bars = useMemo(() => {
    const arr: number[] = [];
    let s = seed;
    for (let i = 0; i < count; i++) {
      s = (s * 9301 + 49297) % 233280;
      const r = s / 233280;
      arr.push(8 + Math.round(r * 20 + Math.sin(i * 0.4) * 4));
    }
    return arr;
  }, [count, seed]);

  return (
    <div className="wave">
      {bars.map((h, i) => (
        <i key={i} style={{ height: `${h}px` }} />
      ))}
    </div>
  );
}
