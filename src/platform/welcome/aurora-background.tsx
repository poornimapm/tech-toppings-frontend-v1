/** Slowly drifting colour glow across the top of the screen, behind the glass header and the
 *  page. Purely decorative; it stands still when the OS asks for reduced motion (global rule
 *  in tokens.css). Fixed to the viewport, so no container clips its edges. */
export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[38rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
    >
      <div className="absolute top-[-30%] left-[5%] size-[34rem] animate-aurora rounded-full bg-[var(--tt-aurora-1)] opacity-40 blur-3xl" />
      <div className="absolute top-[-25%] right-[5%] size-[30rem] animate-aurora rounded-full bg-[var(--tt-aurora-2)] opacity-30 blur-3xl [animation-delay:-8s]" />
      <div className="absolute top-[15%] left-[35%] size-[24rem] animate-aurora rounded-full bg-[var(--tt-aurora-3)] opacity-25 blur-3xl [animation-delay:-15s]" />
    </div>
  );
}
