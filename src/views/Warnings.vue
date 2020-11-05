<template>
  <v-container fluid class="warnings">
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
import {
  HELPPAGES,
  WARNINGS,
  getPersonFamilyName,
  getWarningPersonFamily,
  getWarningLevelDesc
} from "@/utils/ModelUtils";
import { fetchItem, loadPageTitle } from "@/utils/WeRelateUtils";

export default {
  name: "Warnings",
  created() {},
  mounted() {
    loadPageTitle(HELPPAGES[WARNINGS]);
  },
  data() {
    return {
      search: "",
      headers: [
        {
          text: "Person/Family",
          value: "stdName"
        },
        {
          text: "Description",
          value: "description"
        },
        {
          text: "Level",
          value: "level"
        }
      ]
    };
  },
  computed: {
    items() {
      // console.log("computed", this.gedcom.model.warnings);
      if (!this.gedcom.model.warnings) {
        return [];
      }
      return this.gedcom.model.warnings.map(it => {
        return {
          stdName: getPersonFamilyName(getWarningPersonFamily(it)),
          description: it["@warning"],
          level: getWarningLevelDesc(it),
          cls: (it["@warningRead"] === "true" ? "warning_read" : "warning_unread") + it["@warningLevel"].toString(),
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
      let warning = this.gedcom.model.warnings.find(w => w["@id"] === item.id);
      this.$store.dispatch("prefsMarkRead", {
        model: this.gedcom.model,
        data: warning,
        component: WARNINGS
      });
      fetchItem(this.gedcom.model, warning, WARNINGS);
    }
  }
};
</script>

<style>
.warnings {
  margin-top: 0;
  padding-top: 0;
}
.warning_read0 {
  cursor: pointer;
}
.warning_unread0 {
  cursor: pointer;
  font-weight: bold;
}
.warning_read1 {
  cursor: pointer;
  background-color: rgba(255, 192, 203, 0.25);
}
.warning_unread1 {
  cursor: pointer;
  background-color: rgba(255, 192, 203, 0.25);
  font-weight: bold;
}
.warning_read2 {
  cursor: pointer;
  background-color: rgba(255, 192, 203, 0.5);
}
.warning_unread2 {
  cursor: pointer;
  background-color: rgba(255, 192, 203, 0.5);
  font-weight: bold;
}
.warning_read3 {
  cursor: pointer;
  background-color: rgba(255, 192, 203, 0.75);
}
.warning_unread3 {
  cursor: pointer;
  background-color: rgba(255, 192, 203, 0.75);
  font-weight: bold;
}
</style>
