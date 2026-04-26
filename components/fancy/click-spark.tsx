"use client";

/**
 * Vendored from React Bits — https://reactbits.dev/animations/click-spark
 * (TypeScript + CSS variant). Canvas-based radial spark burst on click,
 * scoped to the wrapped subtree.
 *
 * Bytesize override: default `sparkColor` is `var(--color-accent)` (terracotta)
 * instead of the upstream `'#fff'`, since bytesize is dark-canvas-default and
 * the accent is the only colour with semantic load (DESIGN.md §3 / §10).
 *
 * Reduced-motion users get no canvas — the wrapper renders children only and
 * the click handler is a no-op (DESIGN.md §9).
 */

import React, {
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useReducedMotion } from "motion/react";

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  extraScale?: number;
  children?: React.ReactNode;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

export const ClickSpark: React.FC<ClickSparkProps> = ({
  sparkColor = "var(--color-accent)",
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1.0,
  children,
}) => {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<Spark[]>([]);
  const startTimeRef = useRef<number | null>(null);

  // Resolve a CSS variable string (e.g. "var(--color-accent)") to a concrete
  // colour the canvas can stroke with. Falls back to the literal value if it
  // isn't a var(...) expression. Re-resolved per draw so theme changes pick up.
  const resolveColor = useCallback((value: string): string => {
    if (typeof window === "undefined") return value;
    const match = value.match(/^var\((--[^,)\s]+)(?:,\s*(.+))?\)$/);
    if (!match) return value;
    const [, name, fallback] = match;
    const root = canvasRef.current ?? document.documentElement;
    const resolved = getComputedStyle(root).getPropertyValue(name).trim();
    return resolved || fallback || value;
  }, []);

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let resizeTimeout: number | undefined;

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const handleResize = () => {
      if (resizeTimeout) window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, 100);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(parent);
    resizeCanvas();

    return () => {
      ro.disconnect();
      if (resizeTimeout) window.clearTimeout(resizeTimeout);
    };
  }, [reduce]);

  const easeFunc = useCallback(
    (t: number) => {
      switch (easing) {
        case "linear":
          return t;
        case "ease-in":
          return t * t;
        case "ease-in-out":
          return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        case "ease-out":
        default:
          return t * (2 - t);
      }
    },
    [easing]
  );

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const colour = resolveColor(sparkColor);

      sparksRef.current = sparksRef.current.filter((spark: Spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = elapsed / duration;
        const eased = easeFunc(progress);

        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = colour;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true;
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [
    reduce,
    sparkColor,
    sparkSize,
    sparkRadius,
    duration,
    easeFunc,
    extraScale,
    resolveColor,
  ]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = performance.now();
    const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / sparkCount,
      startTime: now,
    }));

    sparksRef.current.push(...newSparks);
  };

  if (reduce) {
    // Reduced-motion: no canvas, no click hook, no rAF loop.
    return <>{children}</>;
  }

  // The wrapper must establish a containing block (position: relative) for the
  // overlay canvas, but otherwise stays out of the layout. `display: inline-block`
  // with width: 100% lets the wrapped element drive its own intrinsic size while
  // the canvas covers the bounding box.
  return (
    <span
      onClick={handleClick}
      style={{
        position: "relative",
        display: "inline-block",
        width: "100%",
      }}
    >
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </span>
  );
};

export default ClickSpark;
