/**
 * Decorative, heavily-faded full-screen background image for a screen.
 *
 * Renders a fixed layer that sits behind the whole UI (below the paper cards,
 * above the notebook grid). The fading / warm tint lives in the `.screen-bg`
 * CSS rule so it always matches the theme — pass a raw image path here.
 *
 * Drop matching artwork into `public/backgrounds/` (see the README there).
 * If the file is missing the layer simply renders nothing, so screens remain
 * fully usable without it.
 */
export function ScreenBackground({ src }: { src: string }) {
  return (
    <div
      aria-hidden="true"
      className="screen-bg"
      style={{ backgroundImage: `url("${src}")` }}
    />
  );
}
