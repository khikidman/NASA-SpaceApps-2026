"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";

/** Seeded visual decoration; never consumes the mission's random sequence. */
export function Starfield({ seed }: { seed: number }) {
  const element = useRef<HTMLDivElement>(null);
  const stars = useMemo(() => {
    return Array.from({ length: 160 }, (_, id) => {
      const sample = (channel: number) => {
        const a = Math.imul(seed ^ Math.imul(id + 1, 0x9e3779b9) ^ Math.imul(channel + 1, 0x85ebca6b), 0x27d4eb2d);
        const b = Math.imul(a ^ (a >>> 15), 0x85ebca6b);
        return ((b ^ (b >>> 13)) >>> 0) / 0x100000000;
      };
      const x = sample(0) * 100;
      const y = sample(1) * 100;
      const size = 0.8 + sample(2) * 1.6;
      const dim = 0.08 + sample(3) * 0.2;
      const bright = 0.45 + sample(4) * 0.5;
      return { id, style: {
        left: `${x}%`, top: `${y}%`, width: `${size}px`, height: `${size}px`,
        "--star-dim": dim, "--star-bright": bright, "--star-steady": (dim + bright) / 2,
        "--star-duration": `${3 + sample(5) * 6}s`, "--star-delay": `${-sample(6) * 20}s`,
      } as CSSProperties };
    });
  }, [seed]);

  useEffect(() => {
    const host = element.current;
    if (!host) return;
    let inView = false;
    const update = () => host.style.setProperty("--star-play-state", !document.hidden && inView ? "running" : "paused");
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(host);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  return <div className="world-starfield" ref={element} aria-hidden="true">
    {stars.map((star) => <span className="star-dot" key={star.id} style={star.style} />)}
  </div>;
}
