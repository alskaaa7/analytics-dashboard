import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Динамически добавляем фавикон чтобы избежать 404
const addFavicon = () => {
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/svg+xml'
  link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📊</text></svg>'
  document.head.appendChild(link)
}

addFavicon()

const app = createApp(App)
app.use(router)
app.mount('#app')
