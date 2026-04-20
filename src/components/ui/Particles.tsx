import { type CSSProperties } from "react";

interface ParticlesProps {
  className?: string;
  color?: string;
  quantity?: number;
  seed?: number;
  size?: number;
}

function getSeededValue(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function Particles({
  className,
  color = "var(--accent)",
  quantity = 18,
  seed = 1,
  size = 1
}: ParticlesProps) {
  const particles = Array.from({ length: quantity }, (_, index) => {
    const base = seed + index * 11;
    const width = (0.16 + getSeededValue(base + 1) * 0.9) * size;
    const height = width;

    return {
      id: `${seed}-${index}`,
      color,
      delay: `${-getSeededValue(base + 4) * 32}s`,
      duration: `${26 + getSeededValue(base + 5) * 30}s`,
      dx: `${-20 + getSeededValue(base + 6) * 40}px`,
      dy: `${-34 + getSeededValue(base + 7) * 68}px`,
      left: `${getSeededValue(base + 8) * 100}%`,
      opacity: `${0.18 + getSeededValue(base + 9) * 0.24}`,
      top: `${getSeededValue(base + 10) * 100}%`,
      width: `${width}rem`,
      height: `${height}rem`
    };
  });

  return (
    <div
      aria-hidden="true"
      className={["particles-layer", className].filter(Boolean).join(" ")}
    >
      {particles.map((particle) => (
        <span
          className="particles-layer__particle"
          key={particle.id}
          style={
            {
              "--particle-color": particle.color,
              "--particle-delay": particle.delay,
              "--particle-duration": particle.duration,
              "--particle-dx": particle.dx,
              "--particle-dy": particle.dy,
              "--particle-height": particle.height,
              "--particle-left": particle.left,
              "--particle-opacity": particle.opacity,
              "--particle-top": particle.top,
              "--particle-width": particle.width
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
