import Vue from "vue";
import Vuex from "vuex";
import * as gedcom from "./modules/gedcom";
import * as prefs from "./modules/prefs";
import * as notifications from "./modules/notifications";

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
