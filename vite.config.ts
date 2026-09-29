import { existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Serves the static pages locally the way Cloudflare Pages serves them live.
 *
 * Pages maps `/legal/` to `legal/index.html` and `/legal/privacy` to
 * `legal/privacy.html`. Vite's dev server does neither: it finds no file and
 * falls back to the React app, so every footer link (`/demo/`, `/legal/`,
 * `/legal/privacy`, ...) quietly reloaded the homepage in development while
 * working in production. Linking to `.html` instead would have "fixed" it at
 * the cost of URLs that 308-redirect on the live site, so the local server is
 * taught the live rules rather than the links being taught the local ones.
 *
 * Only ever rewrites to a file that exists, so anything else — the React app,
 * Vite's own modules — passes through untouched.
 */
function cloudflarePagesRouting(): Plugin {
  const rewrite =
    (root: string): Connect.NextHandleFunction =>
    (req, _res, next) => {
      const [path, query] = (req.url ?? "").split("?");

      // Vite's module graph and the dependency cache are never static pages.
      if (!path || path.startsWith("/@") || path.startsWith("/src/") || path.startsWith("/node_modules/")) {
        return next();
      }

      const candidate = path.endsWith("/")
        ? `${path}index.html`
        : extname(path)
          ? null
          : `${path}.html`;

      if (candidate) {
        const file = resolve(root, `.${decodeURIComponent(candidate)}`);
        // `resolve` normalises `..`, so this keeps a crafted path inside root.
        const inside = file === root || file.startsWith(root + sep);
        if (inside && existsSync(file) && statSync(file).isFile()) {
          req.url = query ? `${candidate}?${query}` : candidate;
        }
      }

      next();
    };

  return {
    name: "cloudflare-pages-routing",
    // Added directly rather than returned, so it runs BEFORE Vite's own
    // middlewares — including the SPA fallback that caused the bug.
    configureServer(server) {
      if (server.config.publicDir) server.middlewares.use(rewrite(server.config.publicDir));
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite(resolve(server.config.root, server.config.build.outDir)));
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflarePagesRouting()],
  // Served from the domain root on Cloudflare Pages (kukis.nl and the
  // *.pages.dev preview URL), so assets resolve from "/".
  base: "/",
  server: { port: 5185, host: true },
  preview: { port: 5185, host: true },
});
