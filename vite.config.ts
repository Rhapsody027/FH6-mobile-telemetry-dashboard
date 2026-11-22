import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	// GitHub Pages serves the demo from /<repo>/; iOS (Capacitor) keeps "/".
	base: process.env.VITE_BASE || "/",
	plugins: [react(), tailwindcss()],
	server: {
		port: 5173,
	},
});
