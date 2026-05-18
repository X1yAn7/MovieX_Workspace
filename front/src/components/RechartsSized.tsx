import React, { useLayoutEffect, useRef, useState } from 'react';

type Size = { width: number; height: number };

/**
 * 给 Recharts 提供确定的 width/height，避免 ResponsiveContainer 在 flex/grid 首帧量到 -1。
 */
export default function RechartsSized({
  height,
  className = '',
  children,
}: {
  height: number;
  className?: string;
  children: (size: Size) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0) setW(Math.max(120, Math.floor(r.width)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`w-full min-w-0 shrink-0 ${className}`.trim()}
      style={{ height, minHeight: height }}
    >
      {w > 0 ? children({ width: w, height }) : null}
    </div>
  );
}
