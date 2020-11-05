<template>
  <v-container fluid class="overview">
    <v-row>
      <v-col>
        <h3>Next steps:</h3>
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
        <v-btn small @click="removeGedcom" :disabled="!gedcom.model.isUpdatable">
          Remove this GEDCOM
        </v-btn>
      </v-col>
      <v-col>
        In case you change your mind about uplading this GEDCOM, you can remove it.
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
import { HELPPAGES, OVERVIEW, getPersonFullName, getEventFact } from "@/utils/ModelUtils.js";
import { loadPageTitle } from "@/utils/WeRelateUtils";

export default {
  name: "Overview",
  mounted() {
    loadPageTitle(HELPPAGES[OVERVIEW]);
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
      console.log("return to werelate");
    },
    removeGedcom() {
      console.log("remove gedcom");
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
