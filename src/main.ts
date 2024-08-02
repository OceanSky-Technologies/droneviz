import { createApp } from "vue";
import App from "./App.vue";
import "./pwa.ts";

const app = createApp(App);
app.config.errorHandler = (err) => {
  console.error("Caught error: " + err);
};

app.mount("#app");
