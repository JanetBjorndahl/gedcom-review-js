<template>
  <v-container fluid class="overview">
    <v-row>
      <v-col>
        <h3>Instructions</h3>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col offset="1">
        {{ gedcom.model.nextSteps }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="3" offset="1">
        <v-btn small @click="returnToWeRelate">
          Return to WeRelate
        </v-btn>
      </v-col>
      <v-col>
        Finish your review later
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="3" offset="1">
        <v-dialog v-model="dialog" persistent max-width="290">
          <template v-slot:activator="{ on, attrs }">
            <v-btn small v-bind="attrs" v-on="on" :disabled="!gedcom.model.isUpdatable">
              Remove this GEDCOM
            </v-btn>
          </template>
          <v-card>
            <v-card-title class="headline">
              Are you sure?
            </v-card-title>
            <v-card-text>
              If you remove your GEDCOM, the work you have done to prepare your GEDCOM for import will be lost.
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="green darken-1" text @click="dialog = false">
                Cancel
              </v-btn>
              <v-btn color="green darken-1" text @click="removeGedcom">
                Remove
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
      <v-col>
        In case you change your mind about uploading this GEDCOM, you can remove it.
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <h3>Quality</h3>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="2" class="label">
        Warning level:
      </v-col>
      <v-col cols="2">
        {{ gedcom.model.warningLevel | percent }}
      </v-col>
      <v-col>
        {{ gedcom.model.warningComment }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="2" class="label">
        Duplicates:
      </v-col>
      <v-col cols="2">
        {{ gedcom.model.duplicateCount }}
      </v-col>
      <v-col>
        {{ gedcom.model.duplicateComment }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="2" class="label">
        Sources:
      </v-col>
      <v-col>
        {{ gedcom.model.totalNonExcludedSources }}
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <h3>Root</h3>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col offset="1">
        {{ primaryPersonFullName }}
        {{ primaryPersonBirthDate }} - {{ primaryPersonDeathDate }}
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <h3>Statistics</h3>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="2" class="label">
        People:
      </v-col>
      <v-col cols="2">
        {{ gedcom.model.peopleToImport }} / {{ gedcom.model.peopleMatched }} / {{ gedcom.model.peopleExcluded }}
      </v-col>
      <v-col>
        to be imported / matched / excluded
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="2" class="label">
        Families:
      </v-col>
      <v-col cols="2">
        {{ gedcom.model.familiesToImport }} / {{ gedcom.model.familiesMatched }} / {{ gedcom.model.familiesExcluded }}
      </v-col>
      <v-col>
        to be imported / matched / excluded
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="2" class="label">
        Warnings:
      </v-col>
      <v-col cols="2"> {{ gedcom.model.warningsRead }} / {{ gedcom.model.warningsUnread }} </v-col>
      <v-col>
        read / unread
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="2" class="label">
        Places:
      </v-col>
      <v-col cols="2"> {{ gedcom.model.placesMatched }} / {{ gedcom.model.placesUnmatched }} </v-col>
      <v-col>
        matched / not matched
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="2" class="label">
        Sources:
      </v-col>
      <v-col cols="2">
        {{ gedcom.model.sourcesToImport }} / {{ gedcom.model.sourcesMatched }} / {{ gedcom.model.sourcesExcluded }} /
        {{ gedcom.model.sourcesCitationOnly }}
      </v-col>
      <v-col>
        to be imported / matched / excluded / citation-only
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="2" class="label">
        Family Matches:
      </v-col>
      <v-col cols="2">
        {{ gedcom.model.matchesMatched }} / {{ gedcom.model.matchesUnmatched }} / {{ gedcom.model.matchesUndecided }}
      </v-col>
      <v-col>
        matched / not matched / undecided
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState } from "vuex";
import { HELPPAGES, OVERVIEW, STATUS_DELETE, getPersonFullName, getEventFact } from "@/utils/ModelUtils";
import { loadPageTitle } from "@/utils/WeRelateUtils";
import { WR_SERVER } from "@/services/Server";
import { loadParentContent } from "@/services/ExternalInterface";

export default {
  name: "Overview",
  mounted() {
    loadPageTitle(HELPPAGES[OVERVIEW]);
  },
  data() {
    return {
      dialog: false
    };
  },
  computed: {
    primaryPersonFullName() {
      return getPersonFullName(this.gedcom.model.primaryPerson);
    },
    primaryPersonBirthDate() {
      return (getEventFact(this.gedcom.model.primaryPerson, "Birth") || {})["@data"];
    },
    primaryPersonDeathDate() {
      return (getEventFact(this.gedcom.model.primaryPerson, "Death") || {})["@data"];
    },
    ...mapState(["gedcom"])
  },
  methods: {
    returnToWeRelate() {
      try {
        loadParentContent("https://" + WR_SERVER);
      } catch (err) {
        this.$store.dispatch("notificationsAdd", err);
      }
    },
    async removeGedcom() {
      try {
        await this.$store.dispatch("gedcomUpdateStatus", { status: STATUS_DELETE });
        loadParentContent("https://" + WR_SERVER);
      } catch (err) {
        await this.$store.dispatch("notificationsAdd", err);
      }
    }
  }
};
</script>

<style>
.label {
  text-align: right;
  font-weight: bold;
}
</style>
