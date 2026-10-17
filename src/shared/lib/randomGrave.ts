const graveBgs = import.meta.glob("@/assets/graves/grave_bg_*.png", {
  eager: true,
  import: "default",
});
const graves = import.meta.glob("@/assets/graves/grave_[0-9]*.png", {
  eager: true,
  import: "default",
});

const graveBgList = Object.values(graveBgs) as string[];
const graveList = Object.values(graves) as string[];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let shuffledBgs = shuffle(graveBgList);
let shuffledFgs = shuffle(graveList);
let bgCursor = 0;
let fgCursor = 0;

export function getRandomGravePair() {
  if (bgCursor >= shuffledBgs.length) {
    shuffledBgs = shuffle(graveBgList);
    bgCursor = 0;
  }
  if (fgCursor >= shuffledFgs.length) {
    shuffledFgs = shuffle(graveList);
    fgCursor = 0;
  }
  return { bg: shuffledBgs[bgCursor++], fg: shuffledFgs[fgCursor++] };
}
