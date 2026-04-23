"use client";

import {
  ElementType,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  motion,
  useInView,
  UseInViewOptions,
  Variants,
} from "motion/react";

import { cn } from "@/lib/utils/cn";

interface MediaBetweenTextProps {
  firstText: string;
  secondText: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  renderMedia?: () => React.ReactNode;
  mediaContainerClassName?: string;
  fallbackUrl?: string;
  as?: ElementType;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  alt?: string;
  triggerType?: "hover" | "ref" | "inView";
  containerRef?: React.RefObject<HTMLDivElement | null>;
  useInViewOptionsProp?: UseInViewOptions;
  animationVariants?: {
    initial: Variants["initial"];
    animate: Variants["animate"];
  };
  className?: string;
  leftTextClassName?: string;
  rightTextClassName?: string;
}

export type MediaBetweenTextRef = {
  animate: () => void;
  reset: () => void;
};

export const MediaBetweenText = forwardRef<
  MediaBetweenTextRef,
  MediaBetweenTextProps
>(function MediaBetweenText(
  {
    firstText,
    secondText,
    mediaUrl,
    mediaType = "image",
    renderMedia,
    mediaContainerClassName,
    fallbackUrl,
    as = "p",
    autoPlay = true,
    loop = true,
    muted = true,
    playsInline = true,
    alt,
    triggerType = "hover",
    containerRef,
    useInViewOptionsProp = {
      once: true,
      amount: 0.5,
      root: containerRef,
    },
    animationVariants = {
      initial: { width: 0, opacity: 1 },
      animate: {
        width: "auto",
        opacity: 1,
        transition: { duration: 0.4, type: "spring", bounce: 0 },
      },
    },
    className,
    leftTextClassName,
    rightTextClassName,
  },
  ref,
) {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const inViewHook = useInView(componentRef, useInViewOptionsProp);
  const isInView = triggerType === "inView" ? inViewHook : false;
  const [isHovered, setIsHovered] = useState(false);

  useImperativeHandle(ref, () => ({
    animate: () => setIsAnimating(true),
    reset: () => setIsAnimating(false),
  }));

  const shouldAnimate =
    triggerType === "hover"
      ? isHovered
      : triggerType === "inView"
        ? isInView
        : triggerType === "ref"
          ? isAnimating
          : false;

  const TextComponent = motion.create(as as React.ElementType);

  return (
    <span
      className={cn("inline-flex items-baseline", className)}
      ref={componentRef}
      onMouseEnter={() => triggerType === "hover" && setIsHovered(true)}
      onMouseLeave={() => triggerType === "hover" && setIsHovered(false)}
    >
      <TextComponent layout className={leftTextClassName}>
        {firstText}
      </TextComponent>
      <motion.span
        className={cn("inline-block overflow-hidden", mediaContainerClassName)}
        variants={animationVariants}
        initial="initial"
        animate={shouldAnimate ? "animate" : "initial"}
      >
        {renderMedia ? (
          renderMedia()
        ) : mediaType === "video" && mediaUrl ? (
          <video
            className="w-full h-full object-cover"
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            playsInline={playsInline}
            poster={fallbackUrl}
          >
            <source src={mediaUrl} type="video/mp4" />
          </video>
        ) : mediaUrl ? (
          <img
            src={mediaUrl}
            alt={alt || `${firstText} ${secondText}`}
            className="w-full h-full object-cover"
          />
        ) : null}
      </motion.span>
      <TextComponent layout className={rightTextClassName}>
        {secondText}
      </TextComponent>
    </span>
  );
});

MediaBetweenText.displayName = "MediaBetweenText";

export default MediaBetweenText;
