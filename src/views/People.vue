<template>
  <v-container fluid class="people">
    <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details></v-text-field>
    <v-data-table
      dense
      :headers="headers"
      :items="items"
      item-key="id"
      :items-per-page="10"
      :item-class="itemClass"
      :search="search"
      @click:row="onClick"
    >
      <template v-slot:item.exclude="{ item }">
        <v-simple-checkbox
          :value="item.exclude"
          @input="toggleItemExclude(item, $event)"
          :ripple="false"
          :disabled="!gedcom.model.isUpdatable || (!gedcom.model.isAdmin && (item.living || item.beforeCutoff))"
        ></v-simple-checkbox>
      </template>
      <template v-slot:item.living="{ item }">
        <v-simple-checkbox v-model="item.living" disabled></v-simple-checkbox>
      </template>
      <template v-slot:item.beforeCutoff="{ item }">
        <v-simple-checkbox v-model="item.beforeCutoff" disabled></v-simple-checkbox>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import { mapState } from "vuex";
import { HELPPAGES, PEOPLE, NOT_CONNECTED, getEventFact, getPersonFullName } from "@/utils/ModelUtils";
import { fetchItem, loadPageTitle } from "@/utils/WeRelateUtils";

export default {
  name: "People",
  created() {},
  mounted() {
    loadPageTitle(HELPPAGES[PEOPLE]);
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
          text: "Name",
          value: "stdName"
        },
        {
          text: "Gender",
          value: "gender"
        },
        {
          text: "Birth",
          value: "birth"
        },
        {
          text: "Death",
          value: "death"
        },
        {
          text: "Distance",
          value: "distance"
        },
        {
          text: "Living",
          value: "living"
        },
        {
          text: "Early",
          value: "beforeCutoff"
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
      if (!this.gedcom.model.people) {
        return [];
      }
      return this.gedcom.model.people.map(it => {
        return {
          exclude: it["@exclude"] === "true",
          stdName: getPersonFullName(it),
          gender: it["gender"] ? it["gender"][0]["#text"] : "",
          birth: it["@living"] === "true" ? "living" : (getEventFact(it, "Birth") || {})["@date"],
          death: it["@living"] === "true" ? "living" : (getEventFact(it, "Death") || {})["@date"],
          distance: it["@distance"] === NOT_CONNECTED ? "not connected to root" : Math.ceil(it["@distance"] / 2),
          living: it["@living"] === "true",
          beforeCutoff: it["@beforeCutoff"] === "true",
          matchedPage: it["@match"],
          cls: it["@exclude"] === "true" ? "person_excluded" : "person_included",
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
    toggleItemExclude(item, $event) {
      try {
        let person = this.gedcom.model.people.find(it => it["@id"] === item.id);
        this.$store.dispatch("gedcomSetExclude", { data: person, exclude: $event ? "true" : "false" });
      } catch (err) {
        this.$store.dispatch("notificationsAdd", err);
      }
    },
    onClick(item) {
      try {
        let person = this.gedcom.model.people.find(it => it["@id"] === item.id);
        fetchItem(this.gedcom.model, person, PEOPLE);
      } catch (err) {
        this.$store.dispatch("notificationsAdd", err);
      }
    }
  }
};
</script>

<style>
.people {
  margin-top: 0;
  padding-top: 0;
}
.person_included {
  cursor: pointer;
  color: black;
}
.person_excluded {
  cursor: pointer;
  color: #777;
}
</style>
