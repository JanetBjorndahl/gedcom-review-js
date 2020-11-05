<template>
  <v-container fluid class="families">
    <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details></v-text-field>
    <v-data-table
      dense
      :headers="headers"
      :items="items"
      :items-per-page="10"
      :item-class="itemClass"
      :search="search"
      @click:row="onClick"
    ></v-data-table>
  </v-container>
</template>

<script>
import { mapState } from "vuex";
import { FAMILIES, NOT_CONNECTED, getEventFact, getFullName, HELPPAGES } from "@/utils/ModelUtils";
import { fetchItem, loadPageTitle } from "@/utils/WeRelateUtils";

export default {
  name: "Families",
  created() {},
  mounted() {
    loadPageTitle(HELPPAGES[FAMILIES]);
  },
  data() {
    return {
      search: "",
      headers: [
        {
          text: "Exclude",
          value: "exclude"
        },
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
        }
      ]
    };
  },
  computed: {
    items() {
      if (!this.gedcom.model.families) {
        return [];
      }
      return this.gedcom.model.families.map(it => {
        return {
          exclude: it["@exclude"],
          husband: it["husband"] ? getFullName(it["husband"][0]) : "",
          wife: it["wife"] ? getFullName(it["wife"][0]) : "",
          marriage: it["@living"] === "true" ? "living" : (getEventFact(it, "Marriage") || {})["@date"],
          distance: it["@distance"] === NOT_CONNECTED ? "not connected to root" : Math.ceil(it["@distance"] / 2),
          matchedPage: it["@match"],
          cls: it["@exclude"] === "true" ? "family_excluded" : "family_included",
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
    onClick(item) {
      let family = this.gedcom.model.families.find(it => it["@id"] === item.id);
      fetchItem(this.gedcom.model, family, FAMILIES);
    }
  }
};
</script>

<style>
.families {
  margin-top: 0;
  padding-top: 0;
}
.family_included {
  cursor: pointer;
  color: black;
}
.family_excluded {
  cursor: pointer;
  color: #777;
}
</style>
