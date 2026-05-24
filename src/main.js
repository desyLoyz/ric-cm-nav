import "./assets/main.css";

import { createApp } from "vue";
import VNetworkGraph from "v-network-graph";
import "v-network-graph/lib/style.css";
import "vue-select/dist/vue-select.css";

import App from "./App.vue";
import router from "./router";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import { createStore } from "./stores/store";
import * as DataService from "./data_service";

const currentLocale = DataService.getStoredLocale();
DataService.getSession(currentLocale).then((sessionData) => {
  const app = createApp(App);
  app.use(createStore(sessionData, currentLocale));
  app.use(router);
  app.use(VNetworkGraph);
  app.mount("#app");
});
