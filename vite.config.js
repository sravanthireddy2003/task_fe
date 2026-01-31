import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
 
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
 
  server: {
    port: 3000,
    // host: '0.0.0.0',  // Allows external access, listen on all network interfaces
    proxy: {
      "/api": {
        target: process.env.VITE_SERVERURL,
        changeOrigin: true,
      },
    },
  },
});