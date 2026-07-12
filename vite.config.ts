import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Served at the root of a custom domain (Cloudflare Pages, or GitHub Pages
  // with a custom domain). Use "/kukis-site/" only for the github.io project URL.
  base: "/",
  server: { port: 5185, host: true },
  preview: { port: 5185, host: true },
});
