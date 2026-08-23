import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const backendUrl = env.VITE_DEV_PROXY_TARGET || "http://localhost:8080"
  const devPort = Number(env.VITE_DEV_PORT || 3000)

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: devPort,
      proxy: {
        "/api": { target: backendUrl, changeOrigin: true },
        "/v1": { target: backendUrl, changeOrigin: true },
        "/setup": { target: backendUrl, changeOrigin: true },
      },
    },
  }
})
