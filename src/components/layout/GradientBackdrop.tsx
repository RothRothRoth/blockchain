/**
 * Shared page backdrop: the emerald gradient + dot-grid texture used on the
 * landing and login pages, reused everywhere so the whole site reads as one
 * design instead of "hero page vs. plain utility pages." Fixed + -z-10 so it
 * sits behind all page content regardless of where it's rendered in the DOM.
 */
export function GradientBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-white to-white"
    >
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#0f4c4633_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
    </div>
  );
}
