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
      <!--      <v-col>-->
      <!--        <v-btn small @click="putOnHold" :disabled="!gedcom.model.isHoldable">-->
      <!--          Put on hold-->
      <!--        </v-btn>-->
      <!--      </v-col>-->
    </v-row>
  </v-container>
</template>

<script>
import { loadPageTitle } from "@/utils/WeRelateUtils";
import { HELPPAGES, IMPORT, STATUS_PHASE2, STATUS_PHASE3 } from "@/utils/ModelUtils";
import { mapState } from "vuex";
import { loadParentContent } from "@/services/ExternalInterface";
import { WR_SERVER } from "@/services/Server";

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
      try {
        let warning = getImportWarning(this.gedcom.model);
        this.$store.dispatch("gedcomUpdateStatus", { status: STATUS_PHASE3, warning: warning }).then(() => {
          alert("Your GEDCOM will be reviewed by an administrator and imported.");
          loadParentContent(WR_SERVER);
        });
      } catch (err) {
        this.$store.dispatch("notificationsAdd", err);
      }
    },
    visitUserTalk() {
      try {
        loadPageTitle("User talk:" + this.gedcom.model.userName);
      } catch (err) {
        this.$store.dispatch("notificationsAdd", err);
      }
    },
    returnToReview() {
      this.$store.dispatch("gedcomUpdateStatus", { status: STATUS_PHASE2 });
      // },
      // putOnHold() {
      //   console.log("putOnHold");
    }
  }
};

function getImportWarning(model) {
  let warning = "";
  // check for pre-1500 birthdate or marriage
  var found = false;
  if (!found) {
    for (let page of model.people) {
      let date = page["@stdDate"];
      if (page["@exclude"] !== "true" && date && +date.substr(0, 4) <= 1500) {
        found = true;
        break;
      }
    }
  }
  if (!found) {
    for (let page of model.families) {
      let date = page["@stdDate"];
      if (page["@exclude"] !== "true" && date && +date.substr(0, 4) <= 1500) {
        found = true;
        break;
      }
    }
  }
  if (found) {
    warning += "medieval people";
  }

  // check for absence of sources or notes
  found = false;
  for (let page of model.people) {
    if (page["@exclude"] !== "true") {
      if (page["source_citation"] && page["source_citation"].length > 0) found = true;
      if (page["note"] && page["note"].length > 0) found = true;
    }
    if (found) break;
  }
  for (let page of model.families) {
    if (page["@exclude"] !== "true") {
      if (page["source_citation"] && page["source_citation"].length > 0) found = true;
      if (page["note"] && page["note"].length > 0) found = true;
    }
    if (found) break;
  }
  if (!found) {
    if (warning.length > 0) warning += "; ";
    warning += "no sources/notes";
  }
  return warning;
}
</script>
