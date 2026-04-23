"use client";

import React, { useEffect, useRef, useState } from "react";
import { InertiaOptions, motion } from "motion/react";

import { cn } from "@/lib/utils/cn";

type DragElementsProps = {
  children: React.ReactNode;
  dragElastic?:
    | number
    | { top?: number; left?: number; right?: number; bottom?: number }
    | boolean;
  dragConstraints?:
    | { top?: number; left?: number; right?: number; bottom?: number }
    | React.RefObject<Element | null>;
  dragMomentum?: boolean;
  dragTransition?: InertiaOptions;
  dragPropagation?: boolean;
  selectedOnTop?: boolean;
  className?: string;
  /**
   * Initial top/left per child index, in CSS units (px, %, etc.).
   * If omitted, children stack at 0,0 — fine for one element, broken for many.
   */
  initialPositions?: Array<{ top?: number | string; left?: number | string }>;
};

const DragElements: React.FC<DragElementsProps> = ({
  children,
  dragElastic = 0.4,
  dragConstraints,
  dragMomentum = false,
  dragTransition = { bounceStiffness: 200, bounceDamping: 300 },
  dragPropagation = true,
  selectedOnTop = true,
  className,
  initialPositions,
}) => {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [zIndices, setZIndices] = useState<number[]>([]);

  useEffect(() => {
    setZIndices(
      Array.from({ length: React.Children.count(children) }, (_, i) => i),
    );
  }, [children]);

  const bringToFront = (index: number) => {
    if (!selectedOnTop) return;
    setZIndices((prev) => {
      const next = [...prev];
      const at = next.indexOf(index);
      next.splice(at, 1);
      next.push(index);
      return next;
    });
  };

  return (
    <div
      ref={constraintsRef}
      className={cn("relative w-full h-full", className)}
    >
      {React.Children.map(children, (child, index) => {
        const pos = initialPositions?.[index];
        return (
          <motion.div
            key={index}
            drag
            dragElastic={dragElastic}
            dragConstraints={dragConstraints || constraintsRef}
            dragMomentum={dragMomentum}
            dragTransition={dragTransition}
            dragPropagation={dragPropagation}
            style={{
              zIndex: zIndices.indexOf(index),
              top: pos?.top,
              left: pos?.left,
            }}
            onPointerDown={() => bringToFront(index)}
            whileDrag={{ cursor: "grabbing" }}
            className="absolute cursor-grab"
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
};

export default DragElements;
