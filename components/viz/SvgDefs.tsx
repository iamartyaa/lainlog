/**
 * Shared SVG <defs> fragment. Include inside any widget's <svg>:
 *
 *   <svg ...>
 *     <defs><SvgDefs /></defs>
 *     ...
 *   </svg>
 */
export function SvgDefs() {
  return (
    <>
      {/* Default arrow marker — inherits current stroke color via context-stroke. */}
      <marker
        id="bs-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
      </marker>

      {/* Smaller arrow, for inline pointers */}
      <marker
        id="bs-arrow-sm"
        viewBox="0 0 8 8"
        refX="7"
        refY="4"
        markerWidth="5"
        markerHeight="5"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" />
      </marker>

      {/* Subtle glow filter for active state */}
      <filter id="bs-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </>
  );
}
