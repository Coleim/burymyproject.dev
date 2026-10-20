import { z } from "zod";

// The production build ships a strict Content-Security-Policy without
// 'unsafe-eval'. Zod's JIT compiler relies on `new Function`, which would be
// blocked and reported on every page load. This must run before any schema is
// created, so main.tsx imports this module first.
z.config({ jitless: true });
