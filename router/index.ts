import { createRouter, createWebHashHistory } from "vue-router";
import App from "~/App.vue";
import VideoAI from "@/components/VideoAI.vue";

const routes = [
  { path: "/", component: App },
  { path: "/video-ai", component: VideoAI },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
