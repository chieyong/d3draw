import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Alleen pure functies: geen DOM, geen componenten. Wat React tekent
    // wordt gecontroleerd met een gerenderde SVG (npm run preview), niet
    // met een nagebootste browser.
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
  server: {
    watch: {
      // In de map hierboven (/Documents/D3/node_modules) staat een oude
      // fsevents v1. Node's module-resolutie loopt omhoog en vindt die,
      // waarna chokidar crasht op de ontbrekende fsevents.watch().
      // De gewone fs.watch van macOS werkt hier prima.
      useFsEvents: false,
    },
  },
})
