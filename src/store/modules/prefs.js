import LocalStorage from "@/services/LocalStorage";
import {
  PLACES,
  SOURCES,
  WARNINGS,
  MATCHES,
  UPDATES,
  setRead,
  setWarningRead,
  setMatchRead,
  setUpdateRead
} from "@/utils/ModelUtils";

export const state = {
  prefs: {
    readFlags: {},
    noShowTips: {}
  }
};

export const mutations = {
  PREFS_UPDATE(state, prefs) {
    state.prefs = prefs;
  }
};

export const actions = {
  prefsRead({ commit, state, dispatch }) {
    let prefs = null;
    try {
      prefs = JSON.parse(LocalStorage.getItem("gedcom-review"));
    } catch (e) {
      console.log("prefsRead error", e);
      dispatch("notificationsAdd", { message: "There was an error reading preferences: " + e.message });
    }
    if (!prefs) {
      prefs = state.prefs;
    }
    try {
      let now = new Date();
      let secondsSinceEpoch = Math.round(now.getTime() / 1000);
      let expirationPeriod = 60 * 60 * 24 * 31; // one month
      let cutoffTime = secondsSinceEpoch - expirationPeriod;
      for (let key of Object.keys(prefs.readFlags)) {
        if (prefs.readFlags[key] < cutoffTime) {
          delete prefs.readFlags[key];
        }
      }
      for (let key of Object.keys(prefs.noShowTips)) {
        if (prefs.noShowTips[key] < cutoffTime) {
          delete prefs.readFlags[key];
        }
      }
      LocalStorage.setItem("gedcom-review", JSON.stringify(prefs));
      commit("PREFS_UPDATE", prefs);
    } catch (e) {
      dispatch("notificationsAdd", { message: "There was an error updating preferences: " + e.message });
    }
    return prefs;
  },
  prefsMarkRead({ commit, state, dispatch }, { model, data, component }) {
    try {
      let prefs = Object.assign({}, state.prefs);
      let itemChanged = false;
      if ((component === PLACES || component === SOURCES) && data["@read"] !== "true") {
        setRead(model, data, "true");
        itemChanged = true;
      } else if (component === WARNINGS && data["@warningRead"] !== "true") {
        setWarningRead(model, data, "true");
        itemChanged = true;
      } else if (component === MATCHES && data["@matchRead"] !== "true") {
        setMatchRead(model, data, "true");
        itemChanged = true;
      } else if (component === UPDATES && data["@updateRead"] !== "true") {
        setUpdateRead(model, data, "true");
        itemChanged = true;
      }
      if (itemChanged) {
        let key = getItemKey(model.gedcomId, component, data["@id"]);
        prefs.readFlags[key] = Math.round(new Date().getTime() / 1000);
      }
      // console.log("prefsMarkRead", prefs);
      LocalStorage.setItem("gedcom-review", JSON.stringify(prefs));
      commit("PREFS_UPDATE", prefs);
    } catch (e) {
      dispatch("notificationsAdd", { message: "There was an error updating preferences: " + e.message });
    }
  }
};

export const getters = {
  prefsGetReadItems: state => (gedcomId, component) => {
    let readItems = {};
    let searchKey = getItemKey(gedcomId, component);
    for (let key of Object.keys(state.prefs.readFlags)) {
      if (key.startsWith(searchKey)) {
        key = key.substr(searchKey.length);
        readItems[key] = true;
      }
    }
    return readItems;
  }
};

function getItemKey(gedcomId, component, id = "") {
  return `${gedcomId}|${component}|${id}`;
}
