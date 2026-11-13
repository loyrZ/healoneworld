import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Express runs Vite during development.
// Both the React website and static-page account menu are built here.
export default defineConfig({
    root: "public",
    envDir: "..",
    plugins: [react(), tailwindcss()],
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: {
                main: fileURLToPath(
                    new URL("./public/index.html", import.meta.url)
                ),
                headerAccount: fileURLToPath(
                    new URL("./public/header-account.jsx", import.meta.url)
                )
            }
        }
    }
});