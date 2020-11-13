import { MESSAGES } from "@/utils/Messages";
import {
  MATCHES,
  NOMATCH,
  NS_FAMILY,
  NS_MYSOURCE,
  NS_PERSON,
  NS_PLACE,
  PLACES,
  SOURCES,
  UPDATES,
  WARNINGS,
  STATUS_ADMIN_REVIEW,
  STATUS_HOLD,
  STATUS_IMPORTING,
  STATUS_PHASE2,
  STATUS_PHASE3,
  getDataComponent,
  getUnprefixedTitle,
  setMatchHelperFields,
  setStdPersonAttrs,
  setStdFamilyAttrs,
  setStdMySourceAttrs,
  updateData,
  createModelObjectFromContent
} from "@/utils/ModelUtils";
import { getChildElementsWithTag, getElementText } from "@/utils/XMLUtils";
import Model from "@/utils/Model";
import { updateRootDistances } from "@/utils/IncludeExclude";
import { visitUserTalk } from "@/utils/WeRelateUtils";

// const UPDATE_DISTANCES_INIT = 0;
// const UPDATE_DISTANCES_EXCLUDE = 1;
// const UPDATE_DISTANCES_INCLUDE = 2;
// const NAME_MATCH_THRESHOLD = 60;
const ALLOWED_WARNINGS = 5;
const WARNING_LOWER_THRESHOLD = 2.0;
const WARNING_UPPER_THRESHOLD = 4.0;

export function loadGedcom(elm, gedcomId, prefsGetReadItems) {
  let model = new Model();
  model.gedcomId = gedcomId;

  let readPlaces = prefsGetReadItems(model.gedcomId, PLACES);
  let readSources = prefsGetReadItems(model.gedcomId, SOURCES);

  for (let page of getChildElementsWithTag(elm, "page")) {
    let ns = +page.getAttribute("namespace");
    if (ns === NS_PERSON) {
      let person = createModelObject("person", page);
      setStdPersonAttrs(person);
      model.addPerson(person);
    } else if (ns === NS_FAMILY) {
      let family = createModelObject("family", page);
      setStdFamilyAttrs(family);
      model.addFamily(family);
    } else if (ns === NS_MYSOURCE) {
      let mysource = createModelObject("mysource", page);
      setStdMySourceAttrs(mysource);
      mysource["@read"] = readSources[mysource["@id"]] ? "true" : "";
      model.addSource(mysource);
    }
  }

  model.sourcesCitationOnly = +elm.getAttribute("citation_only_sources");

  setPrimary(model, elm.getAttribute("primary_person"));
  if (!model.primaryPerson && model.people.length > 0) {
    model.primaryPerson = model.people[0];
  }

  for (let p of getChildElementsWithTag(elm, "place")) {
    let place = {
      "@id": p.getAttribute("key"),
      "@ns": NS_PLACE,
      "@text": p.getAttribute("text"),
      "@stdName": p.getAttribute("text").toLowerCase(),
      "@bestMatch": p.getAttribute("title")
    };
    place["@match"] = !p.getAttribute("error") ? p.getAttribute("title") : "";
    setMatchHelperFields(place);
    place["@read"] = readPlaces[place["@id"]] ? "true" : "";
    model.addPlace(place);
  }

  return model;
}

export function loadGedcomData(model, elm) {
  model.userName = elm.getAttribute("username");
  model.isOwner = elm.getAttribute("owner") === "true";
  model.isAdmin = elm.getAttribute("admin") === "true";
  setStatus(model, elm.getAttribute("gedcomStatus"));
  setPrimary(model, elm.getAttribute("primary"));

  for (let row of getChildElementsWithTag(elm, "result")) {
    let dataComponent = getDataComponent(model, row.getAttribute("key"));
    if (!dataComponent) {
      continue;
    }
    let data = dataComponent.data;
    let match = row.getAttribute("match");
    let text = getElementText(row);
    if (text) {
      updateData(model, data, text);
      data["@edited"] = "true";
    }
    if (row.getAttribute("exclude") && +row.getAttribute("exclude")) {
      data["@exclude"] = getTrueFalse(row.getAttribute("exclude"));
    }
    if (row.getAttribute("living") && +row.getAttribute("living")) {
      data["@living"] = getTrueFalse(row.getAttribute("living"));
    }
    if (row.getAttribute("merged") && +row.getAttribute("merged")) {
      data["@merged"] = getTrueFalse(row.getAttribute("merged"));
    }
    if (match) {
      if (match === NOMATCH) {
        data["@match"] = "";
        data["@nomatch"] = "true";
      } else {
        data["@match"] = getUnprefixedTitle(match);
      }
      setMatchHelperFields(data);
    }
    if (row.getAttribute("matches")) {
      data["@matches"] = row.getAttribute("matches");
      setMatchHelperFields(data);
    }
  }
}

export function modelLoaded(model, prefsGetReadItems) {
  updateRootDistances(model);
  loadWarningsMatchesUpdates(model, prefsGetReadItems);
  updateCounts(model);

  if (model.status === STATUS_HOLD) {
    visitUserTalk(model);
  }
}

function createModelObject(tag, elm) {
  let result = createModelObjectFromContent(tag, getChildElementsWithTag(elm, "content")[0].textContent);
  result["@id"] = elm.getAttribute("id") || "";
  result["@ns"] = elm.getAttribute("namespace") || "";
  result["@exclude"] = elm.getAttribute("exclude") || "";
  result["@living"] = elm.getAttribute("living") || "";
  result["@beforeCutoff"] = elm.getAttribute("beforeCutoff") || "";
  result["@match"] = elm.getAttribute("match") || "";
  result["@matches"] = elm.getAttribute("potentialMatches") || "";
  setMatchHelperFields(result);
  result["@gedcomMatches"] = elm.getAttribute("potentialMatches") || "";
  result["@warning"] = elm.getAttribute("problems") || "";
  return result;
}

function updateCounts(model) {
  let peopleToImport = 0;
  let peopleExcluded = 0;
  let peopleMatched = 0;
  for (let page of model.people) {
    if (page["@exclude"] === "true") {
      peopleExcluded++;
    } else if (!page["@match"]) {
      peopleToImport++;
    } else {
      peopleMatched++;
    }
  }
  model.peopleToImport = peopleToImport;
  model.peopleExcluded = peopleExcluded;
  model.peopleMatched = peopleMatched;

  let familiesToImport = 0;
  let familiesExcluded = 0;
  let familiesMatched = 0;
  for (let page of model.families) {
    if (page["@exclude"] === "true") {
      familiesExcluded++;
    } else if (!page["@match"]) {
      familiesToImport++;
    } else {
      familiesMatched++;
    }
  }
  model.familiesToImport = familiesToImport;
  model.familiesExcluded = familiesExcluded;
  model.familiesMatched = familiesMatched;

  let warningsRead = 0;
  let warningsUnread = 0;
  let warningCount = 0;
  let dupCount = 0;
  for (let warn of model.warnings) {
    if (warn["@warningLevel"] >= 3) {
      dupCount++;
    }
    warningCount += +warn["@warningLevel"];
    if (warn["@warningRead"] === "true") {
      warningsRead++;
    } else {
      warningsUnread++;
    }
  }
  let warningLevel = (warningCount * 100) / Math.max(peopleToImport + peopleMatched, 1.0);
  model.warningCount = warningCount;
  model.warningLevel = warningLevel;
  model.duplicateCount = dupCount;
  model.warningsRead = warningsRead;
  model.warningsUnread = warningsUnread;

  let sourcesToImport = 0;
  let sourcesExcluded = 0;
  let sourcesMatched = 0;
  for (let page of model.sources) {
    if (page["@exclude"] === "true") {
      sourcesExcluded++;
    } else if (!page["@match"]) {
      sourcesToImport++;
    } else {
      sourcesMatched++;
    }
  }
  model.sourcesToImport = sourcesToImport;
  model.sourcesExcluded = sourcesExcluded;
  model.sourcesMatched = sourcesMatched;
  model.totalNonExcludedSources = model.sourcesToImport + model.sourcesMatched + model.sourcesCitationOnly;

  let placesMatched = 0;
  let placesUnmatched = 0;
  for (let page of model.places) {
    if (!page["@match"]) {
      placesUnmatched++;
    } else {
      placesMatched++;
    }
  }
  model.placesMatched = placesMatched;
  model.placesUnmatched = placesUnmatched;

  let matchesMatched = 0;
  let matchesUnmatched = 0;
  let matchesUndecided = 0;
  for (let page of model.matches) {
    if (page["@nomatch"] === "true") {
      matchesUnmatched++;
    } else if (page["@match"]) {
      matchesMatched++;
    } else {
      matchesUndecided++;
    }
  }
  model.matchesMatched = matchesMatched;
  model.matchesUnmatched = matchesUnmatched;
  model.matchesUndecided = matchesUndecided;

  let updatesMade = 0;
  let updatesNotMade = 0;
  for (let page of model.updates) {
    if (page["@merged"] === "true") {
      updatesMade++;
    } else {
      updatesNotMade++;
    }
  }
  model.updatesMade = updatesMade;
  model.updatesNotMade = updatesNotMade;

  updateFlags(model);
}

function isBelowLowerThreshold(model) {
  return model.warningCount <= ALLOWED_WARNINGS || model.warningLevel < WARNING_LOWER_THRESHOLD;
}

function isBelowUpperThreshold(model) {
  return model.warningCount <= ALLOWED_WARNINGS || model.warningLevel < WARNING_UPPER_THRESHOLD;
}

function updateFlags(model) {
  if (isBelowLowerThreshold(model)) {
    model.warningComment = "";
  } else if (isBelowUpperThreshold(model)) {
    model.warningComment = MESSAGES["warningsAboveLowerThreshold"];
  } else {
    model.warningComment = MESSAGES["warningsAboveUpperThreshold"];
  }
  if (!model.duplicateCount) {
    model.duplicateComment = "";
  } else {
    model.duplicateComment = MESSAGES["internalDuplicates"];
  }
  model.isUpdatable = false;
  model.isReturnable = false;
  model.isHoldable = false;
  model.isImportable = false;
  model.isMatchable = false;
  if (model.status === STATUS_PHASE2) {
    let warnings = [];
    if (model.warningsUnread > 0) {
      warnings.push(MESSAGES["notReadyWarnings"]);
    }
    if (model.matchesUndecided > 0) {
      warnings.push(MESSAGES["notReadyFamilies"]);
    }
    if (!isBelowUpperThreshold(model) || model.duplicateCount > 0) {
      model.importInstructions = MESSAGES["notImportable"];
    } else if (warnings.length > 0) {
      model.importInstructions = MESSAGES["notReady"] + warnings.join("; ");
    } else if (!isBelowLowerThreshold(model)) {
      model.importInstructions = MESSAGES["probablyNotImportable"];
    } else {
      model.importInstructions = MESSAGES["phase2"];
    }
    model.isUpdatable = true;
    model.isImportable =
      (isBelowUpperThreshold(model) && model.duplicateCount === 0 && warnings.length === 0) || model.isAdmin;
    model.isMatchable = (isBelowUpperThreshold(model) && model.duplicateCount === 0) || model.isAdmin;
    model.isHoldable = model.isAdmin;
    model.nextSteps = MESSAGES["nextsteps"];
  } else if (model.status === STATUS_HOLD) {
    model.nextSteps = MESSAGES["onhold"];
    model.isUpdatable = true;
    model.isReturnable = model.isAdmin;
  } else if (model.status === STATUS_PHASE3 || model.status === STATUS_IMPORTING) {
    model.importInstructions = model.nextSteps = MESSAGES["phase3"];
  } else if (model.status === STATUS_ADMIN_REVIEW && model.isAdmin) {
    model.importInstructions = MESSAGES["adminReviewAdmin"];
    model.nextSteps = MESSAGES["nextsteps"];
    model.isUpdatable = true;
    model.isReturnable = true;
    model.isImportable = true;
    model.isMatchable = true;
  } else if (model.status === STATUS_ADMIN_REVIEW) {
    model.importInstructions = model.nextSteps = MESSAGES["adminReview"];
  } else if (model.status === 0) {
    // I don't know how they get in this status
    model.importInstructions = model.nextSteps = MESSAGES["statuszero"];
  } else {
    model.importInstructions = model.nextSteps = MESSAGES["statusother"] + ": " + model.status.toString();
  }
  model.isMergeable =
    model.isUpdatable && ((isBelowLowerThreshold(model) && model.duplicateCount === 0) || model.isAdmin);
}

function loadWarningsMatchesUpdates(model, prefsGetReadItems) {
  let readWarnings = prefsGetReadItems(model.gedcomId, WARNINGS);
  let readMatches = prefsGetReadItems(model.gedcomId, MATCHES);
  let readUpdates = prefsGetReadItems(model.gedcomId, UPDATES);

  for (let person of model.people) {
    if (person["@exclude"] !== "true") {
      if (person["@warning"]) {
        model.addUpdateWarnings(person, readWarnings);
      }
      if (person["@updated"] === "true") {
        person["@updateRead"] = readUpdates[person["@id"]] ? "true" : "";
        model.addUpdateUpdate(person);
      }
    }
  }
  for (let family of model.families) {
    if (family["@exclude"] !== "true") {
      if (family["@warning"]) {
        model.addUpdateWarnings(family, readWarnings);
      }
      if (family["@match"] || family["@matches"]) {
        family["@matchRead"] = readMatches[family["@id"]] ? "true" : "";
        model.addUpdateMatch(family);
      }
      if (family["@updated"] === "true") {
        family["@updateRead"] = readUpdates[family["@id"]] ? "true" : "";
        model.addUpdateUpdate(family);
      }
    }
  }
}

function setPrimary(model, id) {
  if (id) {
    let primary = model.personMap[id];
    if (primary) {
      model.primaryPerson = primary;
    }
  }
}

function setStatus(model, status) {
  model.status = +status;
  updateFlags(model);
}

function getTrueFalse(tf) {
  tf = +tf;
  if (tf > 0) {
    return "true";
  }
  if (tf < 0) {
    return "false";
  }
  return "";
}
