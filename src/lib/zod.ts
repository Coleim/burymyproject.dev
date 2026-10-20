import { z } from "zod";

// The production build ships a strict Content-Security-Policy without
// 'unsafe-eval'. Zod's JIT compiler relies on `new Function`, which would be
// blocked and reported on every page load. Schemas are built at import time,
// so every module must import `z` from here (enforced by ESLint) to be sure
// this runs first.
z.config({ jitless: true });

export { z };
