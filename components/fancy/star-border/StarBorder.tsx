import type { ElementType, ComponentPropsWithoutRef, ReactNode, CSSProperties } from "react";
import "./StarBorder.css";

/**
 * StarBorder — vendored from React Bits.
 *
 * A pill-shaped element with two radial-gradient "stars" orbiting along the
 * top and bottom perimeter. The orbit is purely CSS (linear translation
 * loops), so the primitive is a server component by default — no client
 * hooks, no JS animation cost.
 *
 * Modifications vs. the React Bits source:
 *   - Theme integration. The vendor CSS hardcoded the inner content's
 *     `background: #000; color: white; border: 1px solid #222`. Replaced
 *     with `--color-surface` / `--color-text` / `--color-rule` so the
 *     primitive renders correctly on both light and dark themes.
 *   - Default `color` prop. Changed from `"white"` (which collapses on a
 *     light theme) to `"currentColor"` so the orbiting gradient inherits
 *     the surrounding text color by default. Pass an explicit value (e.g.
 *     `"var(--color-accent)"`) when you want a fixed tone.
 *   - Reduced-motion guard. The React Bits source applied the orbit
 *     duration via inline `animationDuration`, which bypasses the global
 *     `prefers-reduced-motion` rule in `globals.css`. The CSS file now
 *     ships an explicit `@media (prefers-reduced-motion: reduce)` block
 *     that sets `animation: none` on the gradient layers, so the primitive
 *     respects user preference.
 *
 * Composition contract:
 *   - The component accepts an `as` polymorphic prop. Default is `"button"`
 *     to match the React Bits demo. For non-interactive uses (badges,
 *     chips, ornaments), pass `as="div"` or `as="span"` so screen readers
 *     don't announce a phantom button.
 *   - Any extra props are forwarded to the rendered element. The two
 *     gradient layers are absolutely positioned children that ignore
 *     pointer events.
 */

export type StarBorderProps<T extends ElementType = "button"> = {
  /** Polymorphic element. Default `"button"`. Use `"div"` or `"span"` for
   *  decorative chips so the chip isn't announced as a button. */
  as?: T;
  /** Color of the orbiting radial gradients. Default `"currentColor"` so
   *  the orbit inherits the surrounding text color. Pass a CSS-var-friendly
   *  token (e.g. `"var(--color-accent)"`) for a fixed tone. */
  color?: string;
  /** Orbit period as a CSS duration. Default `"6s"`. Larger = slower. */
  speed?: string;
  /** Outer wrapper className — applied to the rotating frame. */
  className?: string;
  /** ClassName for the inner content slot (where children render). */
  innerClassName?: string;
  /** Inner content. */
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "color" | "children" | "className">;

export function StarBorder<T extends ElementType = "button">({
  as,
  color = "currentColor",
  speed = "6s",
  className = "",
  innerClassName = "",
  children,
  ...rest
}: StarBorderProps<T>) {
  const Component = (as ?? "button") as ElementType;

  return (
    <Component
      className={`star-border-container ${className}`.trim()}
      {...rest}
    >
      <div
        className="border-gradient-bottom"
        style={
          {
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed,
          } as CSSProperties
        }
      />
      <div
        className="border-gradient-top"
        style={
          {
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed,
          } as CSSProperties
        }
      />
      <div className={`inner-content ${innerClassName}`.trim()}>{children}</div>
    </Component>
  );
}

export default StarBorder;
