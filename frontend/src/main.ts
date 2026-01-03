import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'


import DefaultLayout from "./layouts/DefaultLayout.vue";
import AuthLayout from "./layouts/AuthLayout.vue";
import MainLayout from "./layouts/MainLayout.vue";

const app = createApp(App);
app.use(createPinia())

app.use(router)
app.component("default", DefaultLayout)
app.component("auth", AuthLayout)
app.component("main", MainLayout)
app.mount("#app");