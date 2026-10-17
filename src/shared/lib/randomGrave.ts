const graveBgModules = import.meta.glob("@/assets/graves/grave_bg_*.png", {
  eager: true,
  import: "default",
});
const graveFgModules = import.meta.glob("@/assets/graves/grave_[0-9]*.png", {
  eager: true,
  import: "default",
});

function toFilenameMap(modules: Record<string, unknown>) {
  const map = new Map<string, string>();
  for (const [path, url] of Object.entries(modules)) {
    const filename = path.split("/").pop();
    if (filename) map.set(filename, url as string);
  }
  return map;
}

const bgMap = toFilenameMap(graveBgModules);
const fgMap = toFilenameMap(graveFgModules);

const bgFilenames = [...bgMap.keys()];
const fgFilenames = [...fgMap.keys()];

export type GravePair = { bg: string; fg: string };

/** Picks a random bg/fg filename pairing. Call once and persist the result
 * (e.g. when creating a grave) — don't call on every render. */
export function pickRandomGravePair(): GravePair {
  return {
    bg: bgFilenames[Math.floor(Math.random() * bgFilenames.length)],
    fg: fgFilenames[Math.floor(Math.random() * fgFilenames.length)],
  };
}

/** Resolves stored bg/fg filenames to their bundled asset URLs. */
export function resolveGraveImages(bg: string, fg: string) {
  return {
    bgUrl: bgMap.get(bg) ?? bgMap.get(bgFilenames[0]),
    fgUrl: fgMap.get(fg) ?? fgMap.get(fgFilenames[0]),
  };
}
