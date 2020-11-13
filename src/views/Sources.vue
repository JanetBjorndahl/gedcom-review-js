<template>
  <v-container fluid class="sources">
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
      <template v-slot:item.exclude="{ item }">
        <v-simple-checkbox
          :value="item.exclude"
          @input="toggleItemExclude(item, $event)"
          :ripple="false"
          :disabled="!gedcom.model.isUpdatable"
        ></v-simple-checkbox>
      </template>
      <template v-slot:item.unmatch="{ item }">
        <v-icon medium dense v-if="!item.exclude && item.matchedPage" @click.stop="unmatch(item)"
          >mdi-link-variant-off</v-icon
        >
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import { mapState } from "vuex";
import { HELPPAGES, SOURCES, getMySourceName } from "@/utils/ModelUtils";
import { fetchItem, loadPageTitle } from "@/utils/WeRelateUtils";

export default {
  name: "Sources",
  created() {},
  mounted() {
    loadPageTitle(HELPPAGES[SOURCES]);
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
          text: "Title",
          value: "title"
        },
        {
          text: "Author",
          value: "author"
        },
        {
          text: "Matched Page",
          value: "matchedPage"
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
      if (!this.gedcom.model.sources) {
        return [];
      }
      return this.gedcom.model.sources.map(it => {
        return {
          exclude: it["@exclude"] === "true",
          title: getMySourceName(it, null),
          author: it["author"] ? it["author"][0]["#text"] : "",
          matchedPage: it["@match"],
          cls:
            it["@read"] === "true"
              ? it["@exclude"] === "true"
                ? "source_read_excluded"
                : "source_read_included"
              : it["@exclude"] === "true"
              ? "source_unread_excluded"
              : "source_unread_included",
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
        let source = this.gedcom.model.sources.find(it => it["@id"] === item.id);
        this.$store.dispatch("gedcomSetExclude", { data: source, exclude: $event ? "true" : "false" });
      } catch (err) {
        this.$store.dispatch("notificationsAdd", err);
      }
    },
    unmatch(item) {
      try {
        let source = this.gedcom.model.sources.find(it => it["@id"] === item.id);
        this.$store.dispatch("gedcomUnmatch", { data: source });
      } catch (err) {
        this.$store.dispatch("notificationsAdd", err);
      }
    },
    onClick(item) {
      try {
        let source = this.gedcom.model.sources.find(it => it["@id"] === item.id);
        this.$store.dispatch("prefsMarkRead", {
          model: this.gedcom.model,
          data: source,
          component: SOURCES
        });
        fetchItem(this.gedcom.model, source, SOURCES);
      } catch (err) {
        this.$store.dispatch("notificationsAdd", err);
      }
    }
  }
};
</script>

<style>
.sources {
  margin-top: 0;
  padding-top: 0;
}
.source_read_included {
  cursor: pointer;
  color: black;
}
.source_unread_included {
  cursor: pointer;
  color: black;
  font-weight: bold;
}
.source_read_excluded {
  cursor: pointer;
  color: #777;
}
.source_unread_excluded {
  cursor: pointer;
  color: #777;
  font-weight: bold;
}
</style>
