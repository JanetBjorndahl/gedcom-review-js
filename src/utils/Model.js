import { NS_PERSON } from "@/utils/ModelUtils";

export default class Model {
  constructor() {
    this.gedcomId = 0;
    this.userName = "";
    this.status = 0;
    this.importInstructions = "";
    this.nextSteps = "";
    this.isOwner = false;
    this.isAdmin = false;
    this.isUpdatable = false;
    this.isReturnable = false;
    this.isHoldable = false;
    this.isImportable = false;
    this.isMatchable = false;
    this.isMergeable = false;
    this.primaryPerson = null;
    this.peopleToImport = 0;
    this.peopleExcluded = 0;
    this.peopleMatched = 0;
    this.familiesToImport = 0;
    this.familiesExcluded = 0;
    this.familiesMatched = 0;
    this.warningsRead = 0;
    this.warningsUnread = 0;
    this.warningLevel = 0.0;
    this.warningComment = "";
    this.duplicateCount = 0;
    this.duplicateComment = "";
    this.sourcesToImport = 0;
    this.sourcesMatched = 0;
    this.sourcesExcluded = 0;
    this.sourcesCitationOnly = 0;
    this.totalNonExcludedSources = 0;
    this.placesMatched = 0;
    this.placesUnmatched = 0;
    this.matchesMatched = 0;
    this.matchesUnmatched = 0;
    this.matchesUndecided = 0;
    this.updatesMade = 0;
    this.updatesNotMade = 0;
    this.personMap = {};
    this.familyMap = {};
    this.sourceMap = {};
    this.placeMap = {};
    this.placeTextMap = {};
    this.people = [];
    this.families = [];
    this.sources = [];
    this.places = [];
    this.warnings = [];
    this.matches = [];
    this.updates = [];
  }

  addPerson(person) {
    this.people.push(person);
    this.personMap[person["@id"]] = person;
  }

  addFamily(family) {
    this.families.push(family);
    this.familyMap[family["@id"]] = family;
  }

  addSource(source) {
    this.sources.push(source);
    this.sourceMap[source["@id"]] = source;
  }

  addPlace(place) {
    this.places.push(place);
    this.placeMap[place["@id"]] = place;
    this.placeTextMap[place["@text"]] = place;
  }

  getItemIndex(a, data) {
    return a.findIndex(it => it["@id"] === data["@id"]);
  }

  addUpdate(a, data) {
    if (this.getItemIndex(a, data) >= 0) {
      // a.itemUpdated()
    } else {
      a.push(data);
    }
  }

  remove(a, data) {
    let pos = this.getItemIndex(a, data);
    if (pos >= 0) {
      a.splice(pos, 1);
    }
  }

  addUpdateWarnings(pf, readWarnings) {
    let warns = pf["@warning"].split("|");
    for (let i = 0; i < warns.length; i++) {
      let warn = warns[i];
      let x = {};
      if (pf["@id"].includes("|")) {
        // pf is a warning
        x["@id"] = pf["@id"];
        x["@warning"] = pf["@warning"];
        x["@warningLevel"] = pf["@warningLevel"];
      } else {
        x["@id"] = pf["@id"] + "|" + i.toString();
        let level = +warn.substr(0, 1);
        if (Number.isNaN(level)) {
          x["@warningLevel"] = 1;
          x["@warning"] = warn;
        } else {
          x["@warningLevel"] = level;
          x["@warning"] = warn.substr(1);
        }
      }
      x["@stdName"] = pf["@stdName"];
      x["@ns"] = pf["@ns"];
      if (+x["@ns"] === NS_PERSON) {
        x["person"] = [pf];
      } else {
        x["family"] = [pf];
      }
      if (readWarnings) {
        x["@warningRead"] = readWarnings[x["@id"]] ? "true" : "";
      }
      this.addUpdate(this.warnings, x);
    }
  }

  removeWarnings(pf) {
    let prefix = pf["@id"] + "|";
    for (let i = this.warnings.length - 1; i >= 0; i--) {
      if (this.warnings[i]["@id"].startsWith(prefix)) {
        this.remove(this.warnings, this.warnings[i]);
      }
    }
  }

  addUpdateMatch(data) {
    this.addUpdate(this.matches, data);
  }

  removeMatch(data) {
    this.remove(this.matches, data);
  }

  addUpdateUpdate(data) {
    this.addUpdate(this.updates, data);
  }

  removeUpdate(data) {
    this.remove(this.updates, data);
  }

  // peopleItemUpdated(person) {
  //   let pos = this.people.findIndex(it => it["@id"] === person["@id"]);
  //   this.people.splice(pos, 1, person);
  //   this.personMap[person["@id"]] = person;
  // }

  // familiesItemUpdated(family) {
  //   let pos = this.families.findIndex(it => it["@id"] === family["@id"]);
  //   this.families.splice(pos, 1, family);
  //   this.familyMap[family["@id"]] = family;
  // }

  // sourcesItemUpdated(source) {
  //   let pos = this.sources.findIndex(it => it["@id"] === source["@id"]);
  //   this.sources.splice(pos, 1, source);
  //   this.sourceMap[source["@id"]] = source;
  // }

  // placesItemUpdated(place) {
  //   let pos = this.places.findIndex(it => it["@id"] === place["@id"]);
  //   this.places.splice(pos, 1, place);
  //   this.placeMap[place["@id"]] = place;
  //   this.placeTextMap[place["@text"]] = place;
  // }

  // warningsItemUpdated(warning) {
  //   let pos = this.warnings.findIndex(it => it["@id"] === warning["@id"]);
  //   this.warnings.splice(pos, 1, warning);
  // }
}
