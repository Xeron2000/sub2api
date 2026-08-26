import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
  server: {
    port: 18788,
    host: "0.0.0.0",
    proxy: {
      "/api": { target: "http://localhost:18786", changeOrigin: true },
      "/v1": { target: "http://localhost:18786", changeOrigin: true },
      "/setup": { target: "http://localhost:18786", changeOrigin: true },
    },
  },
})

export default config
