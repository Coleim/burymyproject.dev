class LockBusyError extends Error {
  readonly isAcquireTimeout = true;
}

const tails = new Map<string, Promise<unknown>>();
const held = new Set<string>();

// Serialises session operations inside this tab only. The default lock is
// cross-tab (navigator.locks); on Firefox it makes the background refresh
// reject with an uncaught error. The server tolerates two tabs refreshing at once.
export async function tabLock<R>(
  name: string,
  acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> {
  if (acquireTimeout === 0 && held.has(name)) {
    throw new LockBusyError(`Lock "${name}" is busy`);
  }
  const previous = tails.get(name) ?? Promise.resolve();
  const run = previous.then(
    () => fn(),
    () => fn(),
  );
  const tail = run.then(
    () => undefined,
    () => undefined,
  );
  tails.set(name, tail);
  held.add(name);
  try {
    return await run;
  } finally {
    if (tails.get(name) === tail) {
      tails.delete(name);
      held.delete(name);
    }
  }
}
