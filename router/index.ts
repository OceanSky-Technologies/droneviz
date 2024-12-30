import { createRouter, createWebHistory } from "vue-router";
import App from "~/App.vue";
import VideoAI from "@/components/VideoAI.vue";

const routes = [
  { path: "/", component: App },
  { path: "/video-ai", component: VideoAI },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
