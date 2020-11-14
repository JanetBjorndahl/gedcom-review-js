import { loadGedcom, loadGedcomData, modelLoaded } from "@/utils/ModelLoaderUtils";
import { matchesFound, matchFound, pageUpdated, setExclude, updateStatus, unmatch } from "@/utils/WeRelateUtils";
import { readGedcom, readGedcomData } from "@/services/Server";
import { cloneShallow } from "@/utils/ModelUtils";

export const state = {
  model: {}
};

export const mutations = {
  GEDCOM_UPDATE_MODEL(state, model) {
    // console.log("GEDCOM_UPDATE_MODEL", model);
    state.model = model;
  }
};

export const actions = {
  async gedcomRead({ commit, dispatch, rootGetters }, id) {
    try {
      let xml = await readGedcom(id);
      // console.log("gedcomRead success", xml);
      if (!xml || (xml.getAttribute("status") && xml.getAttribute("status") !== "0")) {
        let err = xml ? xml.getAttribute("status") : "network error";
        console.log("gedcomRead error", err);
        dispatch("notificationsAdd", { message: "There was a problem reading gedcom: " + err });
        return null;
      }
      let model = loadGedcom(xml, id, rootGetters.prefsGetReadItems);
      commit("GEDCOM_UPDATE_MODEL", model);
      return model;
    } catch (error) {
      console.log("gedcomRead error", error);
      dispatch("notificationsAdd", error);
    }
  },
  async gedcomReadData({ commit, dispatch, state, rootGetters }, id) {
    try {
      let xml = await readGedcomData(id);
      // console.log("gedcomReadData success", xml);
      if (!xml || (xml.getAttribute("status") && xml.getAttribute("status") !== "0")) {
        let err = xml ? xml.getAttribute("status") : "network error";
        console.log("gedcomReadData error", err);
        dispatch("notificationsAdd", { message: "There was a problem reading gedcom data: " + err });
        return null;
      }
      let model = cloneShallow(state.model);
      loadGedcomData(model, xml);
      // console.log("gedcomReadData", xml, model);
      modelLoaded(model, rootGetters.prefsGetReadItems);
      commit("GEDCOM_UPDATE_MODEL", model);
      return model;
    } catch (error) {
      console.log("gedcomReadData error", error);
      dispatch("notificationsAdd", error);
    }
  },
  async gedcomSetExclude({ commit, dispatch, state }, { data, exclude }) {
    try {
      let model = cloneShallow(state.model);
      await setExclude(model, data, exclude);
      commit("GEDCOM_UPDATE_MODEL", model);
      return model;
    } catch (error) {
      console.log("gedcomSetExclude error", error);
      dispatch("notificationsAdd", error);
    }
  },
  async gedcomUpdateStatus({ commit, dispatch, state }, { status, warning }) {
    try {
      let model = cloneShallow(state.model);
      await updateStatus(model, status, warning);
      commit("GEDCOM_UPDATE_MODEL", model);
      return model;
    } catch (error) {
      console.log("gedcomUpdateStatus error", error);
      dispatch("notificationsAdd", error);
    }
  },
  async gedcomPageUpdated({ commit, dispatch, state }, { id }) {
    try {
      let model = cloneShallow(state.model);
      await pageUpdated(model, id);
      commit("GEDCOM_UPDATE_MODEL", model);
    } catch (error) {
      console.log("gedcomPageUpdated error", error);
      dispatch("notificationsAdd", error);
    }
  },
  async gedcomMatchFound({ commit, dispatch, state }, { title }) {
    try {
      let model = cloneShallow(state.model);
      await matchFound(model, title);
      commit("GEDCOM_UPDATE_MODEL", model);
    } catch (error) {
      console.log("gedcomMatchFound error", error);
      dispatch("notificationsAdd", error);
    }
  },
  async gedcomMatchesFound({ commit, dispatch, state }, { matchesString, merged, all }) {
    try {
      let model = cloneShallow(state.model);
      await matchesFound(model, matchesString, merged, all);
      commit("GEDCOM_UPDATE_MODEL", model);
    } catch (error) {
      console.log("gedcomMatchesFound error", error);
      dispatch("notificationsAdd", error);
    }
  },
  async gedcomUnmatch({ commit, dispatch, state }, { data }) {
    try {
      let model = cloneShallow(state.model);
      await unmatch(model, data);
      commit("GEDCOM_UPDATE_MODEL", model);
    } catch (error) {
      console.log("gedcomUnmatch error", error);
      dispatch("notificationsAdd", error);
    }
  }
};
