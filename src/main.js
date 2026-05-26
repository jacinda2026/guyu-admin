import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. 引入 Pinia
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
const pinia = createPinia() // 2. 创建 Pinia 实例

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia) // 3. 挂载 Pinia
app.use(router)
app.use(ElementPlus)
app.mount('#app')