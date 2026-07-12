import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Deployed to the github.io project URL (github.io/kukis-site/), so assets
  // must be served from that subpath. Switch to "/" only once a custom domain
  // (Cloudflare Pages, or GitHub Pages + CNAME) is actually configured.
  base: "/kukis-site/",
  server: { port: 5185, host: true },
  preview: { port: 5185, host: true },
});
