import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.COZE_PROXY_PORT || 8787}`,
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        // 你的大后台入口
        admin: path.resolve(__dirname, 'index.html'),
        // 你的前端系统入口
        client: path.resolve(__dirname, 'client.html') 
      }
    }
  }
})
