/**
 * Decorative, faded full-screen background image for a screen.
 *
 * Renders a fixed layer behind the whole UI. A solid paper base
 * (`.screen-bg-scrim`) sits underneath so the notebook grid does not show
 * through the artwork; the fading / warm tint lives in the `.screen-bg` CSS
 * rule so it always matches the theme — pass raw image paths here.
 *
 * Pass an optional `fallback` image that is drawn *beneath* `src`. If `src`
 * is missing (e.g. you haven't dropped in the real photo yet) the fallback
 * shows through, so a screen never goes blank.
 *
 * Drop matching artwork into `public/backgrounds/` (see the README there).
 */
export function ScreenBackground({
  src,
  fallback,
}: {
  src: string;
  fallback?: string;
}) {
  // Layered backgrounds: the first url() paints on top; a missing image is
  // simply skipped, so a 404 on `src` reveals the `fallback` beneath it.
  const backgroundImage = fallback
    ? `url("${src}"), url("${fallback}")`
    : `url("${src}")`;
  return (
    <>
      <div aria-hidden="true" className="screen-bg-scrim" />
      <div aria-hidden="true" className="screen-bg" style={{ backgroundImage }} />
    </>
  );
}
