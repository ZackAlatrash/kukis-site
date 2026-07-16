import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Served from the domain root on Cloudflare Pages (kukis.nl and the
  // *.pages.dev preview URL), so assets resolve from "/".
  base: "/",
  server: { port: 5185, host: true },
  preview: { port: 5185, host: true },
});
