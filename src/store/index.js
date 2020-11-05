import Vue from "vue";
import Vuex from "vuex";
import * as gedcom from "./modules/gedcom.js";
import * as prefs from "./modules/prefs.js";
import * as notifications from "./modules/notifications.js";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    gedcom,
    prefs,
    notifications
  },
  state: {},
  mutations: {},
  actions: {},
  getters: {}
});
