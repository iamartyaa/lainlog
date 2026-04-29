"use client";

/**
 * TiltedCard — vendored from React Bits (DavidHDev/react-bits, ts-default).
 *
 * Adaptations for bytesize (polish-r2 ITEM 6):
 *   - `imageSrc` is now optional. When omitted, `children` render in place
 *     of the <img>, so the component can wrap arbitrary React nodes
 *     (specifically, the home <CourseCard>).
 *   - Reduced-motion safe: when `useReducedMotion()` returns true, the
 *     mouse-tilt handlers no-op — the card never rotates, scales, or shifts.
 *     Prevents motion-induced disorientation for opted-out users.
 *   - The underlying link inside `children` remains a real focusable <a>;
 *     the figure here is decorative, not focusable.
 *
 * Source preserved 1:1 except where annotated; CSS lives in TiltedCard.css.
 */

import type { SpringOptions } from "motion/react";
import { useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import "./TiltedCard.css";

interface TiltedCardProps {
  imageSrc?: React.ComponentProps<"img">["src"];
  altText?: string;
  captionText?: string;
  containerHeight?: React.CSSProperties["height"];
  containerWidth?: React.CSSProperties["width"];
  imageHeight?: React.CSSProperties["height"];
  imageWidth?: React.CSSProperties["width"];
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showMobileWarning?: boolean;
  showTooltip?: boolean;
  overlayContent?: React.ReactNode;
  displayOverlayContent?: boolean;
  /**
   * When provided, replaces the <img> with the given React node. This is
   * the bytesize adaptation that lets the component wrap a CourseCard.
   */
  children?: React.ReactNode;
}

const springValues: SpringOptions = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

export default function TiltedCard({
  imageSrc,
  altText = "Tilted card image",
  captionText = "",
  containerHeight = "300px",
  containerWidth = "100%",
  imageHeight = "300px",
  imageWidth = "300px",
  scaleOnHover = 1.1,
  rotateAmplitude = 14,
  showMobileWarning = true,
  showTooltip = true,
  overlayContent = null,
  displayOverlayContent = false,
  children,
}: TiltedCardProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, {
    stiffness: 350,
    damping: 30,
    mass: 1,
  });

  const [lastY, setLastY] = useState<number>(0);

  function handleMouse(e: React.MouseEvent<HTMLElement>) {
    if (reduce || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);

    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);

    const velocityY = offsetY - lastY;
    rotateFigcaption.set(-velocityY * 0.6);
    setLastY(offsetY);
  }

  function handleMouseEnter() {
    if (reduce) return;
    scale.set(scaleOnHover);
    opacity.set(1);
  }

  function handleMouseLeave() {
    if (reduce) return;
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateFigcaption.set(0);
  }

  // When children are provided (bytesize children-prop adaptation), the
  // figure + inner sizes are dictated by the children's intrinsic flow.
  // Setting "auto" on the figure height + dropping inner height lets the
  // wrapper hug the wrapped CourseCard's content height. For the image
  // variant, the original explicit-size behaviour is preserved.
  const usingChildren = !!children;
  const figureHeight = usingChildren ? "auto" : containerHeight;
  const innerWidth = usingChildren ? "100%" : imageWidth;
  const innerHeight = usingChildren ? "auto" : imageHeight;

  return (
    <figure
      ref={ref}
      className="tilted-card-figure"
      style={{
        height: figureHeight,
        width: containerWidth,
      }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showMobileWarning && (
        <div className="tilted-card-mobile-alert">
          This effect is not optimized for mobile. Check on desktop.
        </div>
      )}

      <motion.div
        className="tilted-card-inner"
        style={{
          width: innerWidth,
          height: innerHeight,
          rotateX,
          rotateY,
          scale,
        }}
      >
        {children ? (
          // bytesize adaptation: render children in place of the <img>.
          // The wrapper takes the full inner-card box; consumers are
          // responsible for sizing their child to fill it.
          <div className="tilted-card-children">{children}</div>
        ) : imageSrc ? (
          <motion.img
            src={imageSrc}
            alt={altText}
            className="tilted-card-img"
            style={{
              width: imageWidth,
              height: imageHeight,
            }}
          />
        ) : null}

        {displayOverlayContent && overlayContent && (
          <motion.div className="tilted-card-overlay">{overlayContent}</motion.div>
        )}
      </motion.div>

      {showTooltip && (
        <motion.figcaption
          className="tilted-card-caption"
          style={{
            x,
            y,
            opacity,
            rotate: rotateFigcaption,
          }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
}
