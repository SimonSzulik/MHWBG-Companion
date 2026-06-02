/** Resolve a bundled icon filename stem to its public URL. */
export const iconUrl = (name: string) =>
  /\.[a-z0-9]+$/i.test(name) ? `/icons/${name}` : `/icons/${name}.png`;
