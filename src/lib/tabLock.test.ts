import { describe, expect, it } from "vitest";
import { tabLock } from "./tabLock";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("tabLock", () => {
  it("runs operations one after another", async () => {
    const log: string[] = [];
    await Promise.all([
      tabLock("a", 5000, async () => { log.push("1 start"); await sleep(20); log.push("1 end"); }),
      tabLock("a", 5000, async () => { log.push("2 start"); log.push("2 end"); }),
    ]);
    expect(log).toEqual(["1 start", "1 end", "2 start", "2 end"]);
  });

  it("keeps going after a failure and returns values", async () => {
    await expect(tabLock("b", 5000, async () => { throw new Error("x"); })).rejects.toThrow("x");
    await expect(tabLock("b", 5000, async () => 42)).resolves.toBe(42);
  });

  it("with timeout 0 and a busy lock, rejects at once with a flagged error", async () => {
    const first = tabLock("c", 5000, () => sleep(50));
    const err = await tabLock("c", 0, async () => 1).catch((e) => e);
    expect(err.isAcquireTimeout).toBe(true);
    await first;
    await expect(tabLock("c", 0, async () => 1)).resolves.toBe(1);
  });
});
