export const state = {
  notificationsList: []
};

let nextId = 1;

export const mutations = {
  NOTIFICATIONS_PUSH(state, notification) {
    state.notificationsList.push({
      ...notification,
      id: nextId++
    });
  },
  NOTIFICATIONS_DELETE(state, id) {
    state.notificationsList = state.notificationsList.filter(notification => notification.id !== id);
  }
};
export const actions = {
  notificationsAdd({ commit }, notification) {
    let message = "";
    if (!notification) {
      message = "Unknown error";
    } else if (notification.message) {
      message = notification.message;
    } else if (notification["@status"]) {
      message = notification["@status"];
    }
    commit("NOTIFICATIONS_PUSH", { message, type: "error" });
  },
  notificationsRemove({ commit }, id) {
    commit("NOTIFICATIONS_DELETE", id);
  }
};
