/// <reference types="vitest" />

import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      integrations: resolve(__dirname, "./integrations"),
      src: resolve(__dirname, "./src"),
      pages: resolve(__dirname, "./pages"),
    },
  },
  test: {
    environment: "jsdom",
  },
})
