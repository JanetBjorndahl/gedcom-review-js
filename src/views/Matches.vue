<template>
  <v-container fluid class="matches">
    <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details></v-text-field>
    <v-data-table
      dense
      :headers="headers"
      :items="items"
      :items-per-page="10"
      :item-class="itemClass"
      :search="search"
      @click:row="onClick"
    >
      <template v-slot:item.unmatch="{ item }">
        <v-icon medium dense v-if="item.matched" @click.stop="unmatch(item)">mdi-link-variant-off</v-icon>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import { mapState } from "vuex";
import { HELPPAGES, MATCHES, NOT_CONNECTED, getEventFact, getFullName } from "@/utils/ModelUtils";
import { fetchItem, loadPageTitle } from "@/utils/WeRelateUtils";

export default {
  name: "Matches",
  created() {},
  mounted() {
    loadPageTitle(HELPPAGES[MATCHES]);
  },
  data() {
    return {
      search: "",
      headers: [
        {
          text: "Husband",
          value: "husband"
        },
        {
          text: "Wife",
          value: "wife"
        },
        {
          text: "Marriage",
          value: "marriage"
        },
        {
          text: "Distance",
          value: "distance"
        },
        {
          text: "Matched Page",
          value: "matchedPage"
        },
        {
          text: "Updated",
          value: "updated"
        },
        {
          text: "Unmatch",
          value: "unmatch"
        }
      ]
    };
  },
  computed: {
    items() {
      if (!this.gedcom.model.matches) {
        return [];
      }
      return this.gedcom.model.matches.map(it => {
        return {
          husband: it["husband"] ? getFullName(it["husband"][0]) : "",
          wife: it["wife"] ? getFullName(it["wife"][0]) : "",
          marriage: it["@living"] === "true" ? "living" : (getEventFact(it, "Marriage") || {})["@date"],
          distance: it["@distance"] === NOT_CONNECTED ? "not connected to root" : Math.ceil(it["@distance"] / 2),
          matched: it["@match"] && it["@nomatch"] !== "true",
          matchedPage: it["@nomatch"] === "true" ? "(not a match)" : it["@match"],
          updated: it["@match"] && it["@merged"] === "true" ? "Yes" : "",
          cls: it["@matchRead"] === "true" ? "match_read" : "match_unread",
          id: it["@id"]
        };
      });
    },
    ...mapState(["gedcom"])
  },
  methods: {
    itemClass(item) {
      return item.cls;
    },
    unmatch(item) {
      try {
        let match = this.gedcom.model.matches.find(it => it["@id"] === item.id);
        this.$store.dispatch("gedcomUnmatch", { data: match });
      } catch (err) {
        this.$store.dispatch("notificationsAdd", err);
      }
    },
    onClick(item) {
      try {
        let match = this.gedcom.model.matches.find(it => it["@id"] === item.id);
        this.$store.dispatch("prefsMarkRead", {
          model: this.gedcom.model,
          data: match,
          component: MATCHES
        });
        fetchItem(this.gedcom.model, match, MATCHES);
      } catch (err) {
        this.$store.dispatch("notificationsAdd", err);
      }
    }
  }
};
</script>

<style>
.matches {
  margin-top: 0;
  padding-top: 0;
}
.match_read {
  cursor: pointer;
}
.match_unread {
  cursor: pointer;
  font-weight: bold;
}
</style>
