"use client";

/**
 * Vendored from React Bits — https://reactbits.dev/components/stack
 * (TypeScript + Tailwind variant). Absolutely-positioned card pile with
 * z-ordering, optional drag-to-reorder, optional autoplay. Each card sits
 * on top of the previous via `transformOrigin: '90% 90%'` + a `rotateZ`
 * derived from depth — so the OUTER container size is invariant regardless
 * of how many cards are in the pile (R6 frame-stability win).
 *
 * lainlog-specific overrides:
 *   1. `disableDrag?: boolean` prop added — when `true`, the disabled-drag
 *      <CardRotate> variant is used unconditionally, ignoring the
 *      `mobileClickOnly` / `isMobile` branch. lainlog uses Stack for
 *      runtime-owned mechanics (call stacks, undo states) where the user
 *      shouldn't drag cards around.
 *   2. `useReducedMotion()` branch — under reduced motion, cards mount in
 *      their final stacked layout (no enter animations, no rotateZ random
 *      jitter, no spring transitions). DESIGN.md §9.
 *   3. No separate `.css` file — upstream uses a small Stack.css; we inline
 *      the equivalents as Tailwind classes / inline styles. The lainlog
 *      project doesn't import per-component .css files.
 *   4. Default `cards = []` — upstream defaults to four Unsplash
 *      placeholder images; lainlog callers always supply their own
 *      content, and we don't want a network image dependency in the
 *      bundle.
 *   5. `"use client"` directive — required for the `useState` / `useEffect`
 *      / `motion` hooks the component depends on.
 *   6. `mode?: "messy" | "tidy"` prop added — see StackProps for details.
 *      `"messy"` preserves upstream rotateZ-around-90/90 behaviour;
 *      `"tidy"` is a deck-of-cards-on-a-desk mode where each card behind
 *      the top peeks out via a vertical stagger and `transformOrigin: top
 *      center`. CallStackECs uses tidy so a reader can see depth identity.
 *
 * Named + default export for symmetry with `click-spark.tsx`.
 */

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "motion/react";
import { useEffect, useState } from "react";

interface CardRotateProps {
  children: React.ReactNode;
  onSendToBack: () => void;
  sensitivity: number;
  disableDrag?: boolean;
}

function CardRotate({
  children,
  onSendToBack,
  sensitivity,
  disableDrag = false,
}: CardRotateProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    if (
      Math.abs(info.offset.x) > sensitivity ||
      Math.abs(info.offset.y) > sensitivity
    ) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  if (disableDrag) {
    return (
      <motion.div
        className="absolute inset-0"
        style={{ x: 0, y: 0 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

export interface StackProps {
  randomRotation?: boolean;
  sensitivity?: number;
  sendToBackOnClick?: boolean;
  cards?: React.ReactNode[];
  animationConfig?: { stiffness: number; damping: number };
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  mobileClickOnly?: boolean;
  mobileBreakpoint?: number;
  /**
   * lainlog override: when `true`, drag is fully disabled regardless of
   * `mobileClickOnly` / `isMobile`. The runtime owns push/pop order.
   */
  disableDrag?: boolean;
  /**
   * lainlog override: layout mode for the pile.
   *   - `"messy"` (default): upstream behaviour. Cards rotate around
   *     `transformOrigin: 90% 90%`, scale down with depth — reads as a
   *     casually tossed pile. Good for "look at the top thing" mechanics
   *     where individual depth identity doesn't matter.
   *   - `"tidy"`: zero rotation. Each card behind the top is offset
   *     UPWARD by `depth * 12 px` and scaled around `transformOrigin: top
   *     center`, so every lower card peeks visibly above the one in
   *     front. Reads as a deck of cards on a desk — depth identity is
   *     legible. Used in `CallStackECs` so the reader can see *that*
   *     there are 2 / 3 EC frames stacked, not just the top one.
   *
   * The Stack primitive owns position + rotation + scale only. Border /
   * background / depth-aware styling are the caller's concern (each card
   * supplies its own body).
   */
  mode?: "messy" | "tidy";
}

export function Stack({
  randomRotation = false,
  sensitivity = 200,
  cards = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
  disableDrag = false,
  mode = "messy",
}: StackProps) {
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mobileBreakpoint]);

  const shouldDisableDrag = disableDrag || (mobileClickOnly && isMobile);
  const shouldEnableClick =
    !disableDrag && (sendToBackOnClick || (mobileClickOnly && isMobile));

  const [stack, setStack] = useState<
    { id: number; content: React.ReactNode }[]
  >(() =>
    cards.length
      ? cards.map((content, index) => ({ id: index + 1, content }))
      : [],
  );

  useEffect(() => {
    setStack(cards.map((content, index) => ({ id: index + 1, content })));
  }, [cards]);

  const sendToBack = (id: number) => {
    setStack((prev) => {
      const newStack = [...prev];
      const index = newStack.findIndex((card) => card.id === id);
      if (index < 0) return prev;
      const [card] = newStack.splice(index, 1);
      newStack.unshift(card);
      return newStack;
    });
  };

  useEffect(() => {
    if (autoplay && stack.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        const topCardId = stack[stack.length - 1].id;
        sendToBack(topCardId);
      }, autoplayDelay);
      return () => clearInterval(interval);
    }
  }, [autoplay, autoplayDelay, stack, isPaused]);

  return (
    <div
      className="relative w-full h-full"
      style={{ perspective: 600 }}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {stack.map((card, index) => {
        // depth = how far from the top this card is. The TOP card is the
        // last in the array, so depth = stack.length - 1 - index.
        const depth = stack.length - 1 - index;
        const isTidy = mode === "tidy";

        const randomRotate =
          randomRotation && !reduce && !isTidy ? Math.random() * 10 - 5 : 0;
        const targetRotate = reduce || isTidy
          ? 0
          : depth * 4 + randomRotate;
        // Tidy: slightly larger scale step so depth is felt; messy keeps
        // the upstream 0.06.
        const tidyScaleStep = 0.06;
        const targetScale = reduce
          ? 1
          : isTidy
          ? 1 - depth * tidyScaleStep
          : 1 + index * 0.06 - stack.length * 0.06;
        // Tidy: lift each card behind the top by depth*12 px so the top
        // edge of every lower card peeks out from behind. Messy keeps 0.
        const targetY = reduce || !isTidy ? 0 : -depth * 12;
        const targetTransformOrigin = isTidy ? "top center" : "90% 90%";
        return (
          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
          >
            <motion.div
              className="rounded-2xl overflow-hidden w-full h-full"
              onClick={() =>
                shouldEnableClick && sendToBack(card.id)
              }
              animate={{
                rotateZ: targetRotate,
                scale: targetScale,
                y: targetY,
                transformOrigin: targetTransformOrigin,
              }}
              initial={false}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: animationConfig.stiffness,
                      damping: animationConfig.damping,
                    }
              }
            >
              {card.content}
            </motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
}

export default Stack;
