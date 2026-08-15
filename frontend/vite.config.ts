import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

const { SSL_CERT_PATH, SSL_KEY_PATH } = process.env

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    https:
      SSL_CERT_PATH && SSL_KEY_PATH
        ? { cert: fs.readFileSync(SSL_CERT_PATH), key: fs.readFileSync(SSL_KEY_PATH) }
        : undefined,
  },
})
