import react from "@vitejs/plugin-react";
import { createHash } from "crypto";
import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";

// GitHub Pages cannot send custom HTTP headers, so the Content-Security-Policy
// is delivered as a <meta> tag. Production builds only: the dev server injects
// inline scripts (React Fast Refresh) that a strict policy would block.
function cspMetaPlugin(): Plugin {
  let supabaseOrigin = "";

  return {
    name: "csp-meta",
    apply: "build",
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), "VITE_");
      if (env.VITE_SUPABASE_URL) {
        supabaseOrigin = new URL(env.VITE_SUPABASE_URL).origin;
      }
    },
    transformIndexHtml(html) {
      const inlineScriptHashes = [
        ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
      ].map(
        (match) =>
          `'sha256-${createHash("sha256").update(match[1]).digest("base64")}'`,
      );

      const connectSrc = ["'self'"];
      if (supabaseOrigin) {
        connectSrc.push(
          supabaseOrigin,
          supabaseOrigin.replace(/^https:/, "wss:"),
        );
      }

      const policy = [
        "default-src 'self'",
        `script-src 'self' ${inlineScriptHashes.join(" ")}`.trim(),
        "style-src 'self' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com",
        "img-src 'self' data:",
        `connect-src ${connectSrc.join(" ")}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ");

      return [
        {
          tag: "meta",
          attrs: { "http-equiv": "Content-Security-Policy", content: policy },
          injectTo: "head-prepend",
        },
      ];
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "/burymyproject.dev/",
  plugins: [react(), cspMetaPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
