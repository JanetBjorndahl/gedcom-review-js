<template>
  <v-app id="app">
    <v-navigation-drawer
      :clipped="true"
      :mini-variant="$vuetify.breakpoint.mdAndDown"
      :permanent="true"
      :width="180"
      app
    >
      <v-list dense>
        <template v-for="item in items">
          <v-list-item :key="item.text" :to="item.link" link>
            <v-list-item-action>
              <v-icon :title="item.text">{{ item.icon }}</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>{{ item.text }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <multipane class="horizontal-panes" layout="horizontal">
        <div id="container-wrapper" :style="{ minHeight: '10%', maxHeight: '90%', height: '250px' }">
          <Notifications />
          <v-container>
            <v-row>
              <router-view id="view" :key="$route.fullPath"></router-view>
            </v-row>
          </v-container>
        </div>
        <multipane-resizer></multipane-resizer>
        <div class="iframe-parent" :style="{ minHeight: '10%', maxHeight: '90%', flexGrow: 1 }">
          <iframe
            id="iframe"
            src="https://www.werelate.org/wiki/Help:Review_GEDCOM"
            frameborder="0"
            :style="{ flexGrow: 1 }"
          ></iframe>
        </div>
      </multipane>
    </v-main>
  </v-app>
</template>

<script>
import { Multipane, MultipaneResizer } from "vue-multipane";
import Notifications from "@/components/Notifications.vue";
import NProgress from "nprogress";
import store from "@/store";

export default {
  components: {
    Multipane,
    MultipaneResizer,
    Notifications
  },
  created() {
    let result = window.location.href.match(/gedcomId=(\d+)/);
    let gedcomId = result ? result[1] : 0;
    console.log("gedcomId", gedcomId);
    store.dispatch("prefsRead").then(() => {
      store.dispatch("gedcomRead", gedcomId).then(() => {
        store.dispatch("gedcomReadData", gedcomId);
      });
    });
  },
  mounted() {
    NProgress.configure({ parent: "#container-wrapper" });
    // set up callbacks from php code
    window.review = {
      loadGedcomId(id) {
        try {
          console.log("loadGedcomId", id);
          // loadGedcomId(store.state.gedcom.model, id);
        } catch (err) {
          console.log("loadGedcomId error", err);
        }
      },
      matchFound(title) {
        try {
          // console.log("matchFound", title);
          store.dispatch("gedcomMatchFound", { title });
        } catch (err) {
          console.log("matchFound error", err);
        }
      },
      matchesFound(matchesString, merged, all) {
        try {
          // console.log("matchesFound", matchesString, merged, all);
          store.dispatch("gedcomMatchesFound", { matchesString, merged, all });
        } catch (err) {
          console.log("matchesFound error", err);
        }
      },
      pageUpdated(id) {
        try {
          // console.log("pageUpdated", id);
          store.dispatch("gedcomPageUpdated", { id });
        } catch (err) {
          console.log("pageUpdated error", err);
        }
      }
    };
  },
  props: {
    source: String
  },
  data: () => ({
    dialog: false,
    items: [
      { icon: "mdi-home", text: "Overview", link: "/" },
      { icon: "mdi-alert", text: "Warnings", link: "/warnings" },
      { icon: "mdi-account", text: "People", link: "/people" },
      { icon: "mdi-account-group", text: "Families", link: "/families" },
      { icon: "mdi-map-marker", text: "Places", link: "/places" },
      { icon: "mdi-bookshelf", text: "Sources", link: "/sources" },
      { icon: "mdi-link", text: "Matches", link: "/matches" },
      { icon: "mdi-import", text: "Import", link: "/import" }
    ]
  }),
  computed: {
    bottomHeight() {
      // console.log("clientHeight", document.body.clientHeight);
      // console.log("scrollHeight", document.body.scrollHeight);
      // console.log("pageYOffset", window.pageYOffset);
      // let elm = document.getElementById("iframe");
      // console.log("elm", elm);
      // if (elm) {
      // let distanceToTop = window.pageYOffset + elm.getBoundingClientRect().top;
      // console.log("elm.top", elm.getBoundingClientRect().top);
      // console.log("distanceToTop", distanceToTop);
      //}
      return 400;
    }
  }
};
</script>

<style>
#container-wrapper {
  width: 100%;
  overflow: auto;
}
#iframe {
  width: 100%;
  height: 100%;
  overflow: auto;
}
.horizontal-panes {
  height: 100%;
  width: 100%;
}
.iframe-parent {
  padding-top: 30px;
}
.multipane-resizer {
  margin: 0;
  top: 0; /* reset default styling */
  height: 15px;
  background: lightgray;
}
.rowHover {
  cursor: pointer;
}
.v-data-table--dense .v-data-table-header {
  background: #f1f1f1;
  padding-top: 5px;
}
.columns-resize-bar {
  border-left: solid 1px #ccc;
  height: 100px;
  max-height: 31px;
}
.errorMessage {
  color: red;
}
.no-underline a {
  text-decoration: none;
}
.text-first-caps {
  text-transform: capitalize;
}
.smallCheckbox .v-checkbox {
  color: #0097a7 !important;
}

.smallCheckbox i {
  font-size: 17px !important;
  color: #0097a7 !important;
  margin-top: -3px;
}
</style>
