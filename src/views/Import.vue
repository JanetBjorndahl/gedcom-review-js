<template>
  <v-container fluid class="import">
    <h1>Import your GEDCOM</h1>
    <p>{{ gedcom.model.importInstructions }}</p>
    <v-row>
      <v-col>
        <v-btn small @click="readyToImport" :disabled="!gedcom.model.isImportable">
          Ready to import
        </v-btn>
      </v-col>
      <v-col>
        <v-btn small @click="visitUserTalk" :disabled="!gedcom.model.isReturnable">
          Leave a message
        </v-btn>
      </v-col>
      <v-col>
        <v-btn small @click="returnToReview" :disabled="!gedcom.model.isReturnable">
          Return to user review
        </v-btn>
      </v-col>
      <v-col>
        <v-btn small @click="putOnHold" :disabled="!gedcom.model.isHoldable">
          Put on hold
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { loadPageTitle } from "@/utils/WeRelateUtils";
import { HELPPAGES, IMPORT } from "@/utils/ModelUtils";
import { mapState } from "vuex";

export default {
  name: "Import",
  created() {},
  mounted() {
    loadPageTitle(HELPPAGES[IMPORT]);
  },
  data() {
    return {};
  },
  computed: mapState(["gedcom"]),
  methods: {
    readyToImport() {
      console.log("readyToImport");
    },
    visitUserTalk() {
      console.log("visitUserTalk");
    },
    returnToReview() {
      console.log("returnToReview");
    },
    putOnHold() {
      console.log("putOnHold");
    }
  }
};
</script>
