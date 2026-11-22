/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O site e a API respondem no mesmo endereço (o cookie de sessão é SameSite=Lax):
// em desenvolvimento, o Vite repassa /api e /uploads para o FastAPI.
// 127.0.0.1 e não localhost: no Windows "localhost" pode ir para o IPv6 (::1), onde o uvicorn não escuta
const api = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': api, '/uploads': api } },
})
