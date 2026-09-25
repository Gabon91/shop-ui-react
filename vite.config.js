import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').pop()
const base = process.env.VITE_BASE_PATH
  || (process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : '/')

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
})
