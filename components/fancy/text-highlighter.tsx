"use client";

import {
  ElementType,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  Transition,
  useInView,
  UseInViewOptions,
} from "motion/react";

import { cn } from "@/lib/utils/cn";

type HighlightDirection = "ltr" | "rtl" | "ttb" | "btt";

type TextHighlighterProps = {
  children: React.ReactNode;
  as?: ElementType;
  triggerType?: "hover" | "ref" | "inView" | "auto";
  transition?: Transition;
  useInViewOptions?: UseInViewOptions;
  className?: string;
  highlightColor?: string;
  direction?: HighlightDirection;
} & React.HTMLAttributes<HTMLElement>;

export type TextHighlighterRef = {
  animate: (direction?: HighlightDirection) => void;
  reset: () => void;
};

function sizeFor(direction: HighlightDirection, animated: boolean): string {
  switch (direction) {
    case "ttb":
    case "btt":
      return animated ? "100% 100%" : "100% 0%";
    case "ltr":
    case "rtl":
    default:
      return animated ? "100% 100%" : "0% 100%";
  }
}

function positionFor(direction: HighlightDirection): string {
  switch (direction) {
    case "rtl":
      return "100% 0%";
    case "btt":
      return "0% 100%";
    case "ttb":
    case "ltr":
    default:
      return "0% 0%";
  }
}

export const TextHighlighter = forwardRef<
  TextHighlighterRef,
  TextHighlighterProps
>(function TextHighlighter(
  {
    children,
    as,
    triggerType = "inView",
    transition = { type: "spring", duration: 1, bounce: 0 },
    useInViewOptions = { once: true, initial: false, amount: 0.6 },
    className,
    highlightColor = "color-mix(in oklab, var(--color-accent) 28%, transparent)",
    direction = "ltr",
    ...props
  },
  ref,
) {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentDirection, setCurrentDirection] =
    useState<HighlightDirection>(direction);

  useEffect(() => {
    setCurrentDirection(direction);
  }, [direction]);

  const inViewHook = useInView(componentRef, useInViewOptions);
  const isInView = triggerType === "inView" ? inViewHook : false;

  useImperativeHandle(ref, () => ({
    animate: (animationDirection?: HighlightDirection) => {
      if (animationDirection) setCurrentDirection(animationDirection);
      setIsAnimating(true);
    },
    reset: () => setIsAnimating(false),
  }));

  const shouldAnimate =
    triggerType === "hover"
      ? isHovered
      : triggerType === "inView"
        ? isInView
        : triggerType === "ref"
          ? isAnimating
          : triggerType === "auto"
            ? true
            : false;

  const animatedSize = useMemo(
    () => sizeFor(currentDirection, shouldAnimate),
    [currentDirection, shouldAnimate],
  );
  const initialSize = useMemo(
    () => sizeFor(currentDirection, false),
    [currentDirection],
  );
  const backgroundPosition = useMemo(
    () => positionFor(currentDirection),
    [currentDirection],
  );

  const highlightStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(${highlightColor}, ${highlightColor})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition,
    backgroundSize: animatedSize,
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  };

  const ElementTag = (as || "span") as ElementType;

  return (
    <ElementTag
      ref={componentRef}
      onMouseEnter={() => triggerType === "hover" && setIsHovered(true)}
      onMouseLeave={() => triggerType === "hover" && setIsHovered(false)}
      {...props}
    >
      <motion.span
        className={cn("inline", className)}
        style={highlightStyle}
        animate={{ backgroundSize: animatedSize }}
        initial={{ backgroundSize: initialSize }}
        transition={transition}
      >
        {children}
      </motion.span>
    </ElementTag>
  );
});

TextHighlighter.displayName = "TextHighlighter";

export default TextHighlighter;
