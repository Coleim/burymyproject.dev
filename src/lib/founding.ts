// The first ten people to bury a grave each get a golden first grave. The slots
// are awarded by the database (see supabase/migrations/…_founding_ghosts.sql);
// this is only how they are called and displayed.
export const FOUNDING_TITLE = "Founding Ghost";
export const FOUNDING_SLOTS = 10;

export type FoundingSpotsMessage = {
  text: string;
  /** Whether a slot is still up for grabs (so the message can invite to dig a grave). */
  claimable: boolean;
};

/** What the home page says about the remaining Founding Ghost slots. */
export function foundingSpotsMessage(claimed: number): FoundingSpotsMessage {
  const left = Math.max(0, FOUNDING_SLOTS - claimed);
  if (left === 0) {
    return { text: `All ${FOUNDING_SLOTS} ${FOUNDING_TITLE}s have been claimed`, claimable: false };
  }
  if (left === FOUNDING_SLOTS) {
    return { text: `Be the first of ${FOUNDING_SLOTS} ${FOUNDING_TITLE}s`, claimable: true };
  }
  if (left === 1) {
    return { text: `Last ${FOUNDING_TITLE} spot!`, claimable: true };
  }
  return { text: `${left} of ${FOUNDING_SLOTS} ${FOUNDING_TITLE} spots left`, claimable: true };
}
