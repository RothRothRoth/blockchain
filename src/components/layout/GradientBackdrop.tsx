/**
 * Shared page backdrop: the emerald gradient + dot-grid texture used on the
 * landing and login pages, reused everywhere so the whole site reads as one
 * design instead of "hero page vs. plain utility pages." Fixed + -z-10 so it
 * sits behind all page content regardless of where it's rendered in the DOM.
 *
 * "vivid" adds the soft blurred color blobs from the landing page hero, for
 * pages like login/verify that aren't full of their own white content cards.
 * The dashboard shell keeps the plain "subtle" default so it doesn't compete
 * with the stat cards and tables on top of it.
 */
export function GradientBackdrop({ variant = "subtle" }: { variant?: "subtle" | "vivid" }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br ${
        variant === "vivid"
          ? "from-emerald-100 via-teal-50 to-white"
          : "from-emerald-50 via-white to-white"
      }`}
    >
      {variant === "vivid" && (
        <>
          <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-teal-300/50 blur-3xl" />
          <div className="absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full bg-emerald-300/50 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-72 w-72 translate-y-1/2 rounded-full bg-teal-200/40 blur-3xl" />
        </>
      )}
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#0f4c4633_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
    </div>
  );
}
