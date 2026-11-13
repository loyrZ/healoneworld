import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The React site lives in public/. Express runs Vite for us (see app.js),
// so you don't run vite directly; just use npm run dev.
export default defineConfig({
    root: "public",
    envDir: "..",
    plugins: [react(), tailwindcss()],
    build: {
        outDir: "../dist",
        emptyOutDir: true,
    },
});
