import Model from "@/utils/Model.js";
import {
  PLACES,
  SOURCES,
  WARNINGS,
  MATCHES,
  UPDATES,
  NS_PERSON,
  NS_FAMILY,
  NS_MYSOURCE,
  NS_PLACE,
  STATUS_PHASE2,
  STATUS_PHASE3,
  STATUS_HOLD,
  STATUS_IMPORTING,
  STATUS_ADMIN_REVIEW,
  NOMATCH,
  getPersonFullName,
  getFullName,
  getMySourceName,
  itemUpdated,
  getTrueFalse,
  getEventFact,
  getUnprefixedTitle,
  getDataComponent
} from "@/utils/ModelUtils.js";
import { setMatchHelperFields } from "@/utils/WeRelateUtils.js";
import { readGedcom, readGedcomData } from "@/services/Server.js";
import { MESSAGES } from "@/utils/Messages.js";
import { getDateSortKey } from "@/utils/DateUtils.js";
import { parseXML, xmlToJson, getChildElementsWithTag, getElementText } from "@/utils/XMLUtils.js";
import { updateRootDistances } from "@/utils/IncludeExclude.js";

// const UPDATE_DISTANCES_INIT = 0;
// const UPDATE_DISTANCES_EXCLUDE = 1;
// const UPDATE_DISTANCES_INCLUDE = 2;
const ALLOWED_WARNINGS = 5;
const WARNING_LOWER_THRESHOLD = 2.0;
const WARNING_UPPER_THRESHOLD = 4.0;

// const NAME_MATCH_THRESHOLD = 60;

export const state = {
  model: {}
};

export const mutations = {
  GEDCOM_UPDATE_MODEL(state, model) {
    // console.log("GEDCOM_UPDATE_MODEL", model);
    state.model = model;
  }
};

export const actions = {
  gedcomRead({ commit, dispatch, rootGetters }, id) {
    return readGedcom(id)
      .then(xml => {
        console.log("gedcomRead success", xml);
        if (!xml || (xml.getAttribute("status") && xml.getAttribute("status") !== "0")) {
          const notification = {
            error: xml ? xml.getAttribute("status") : "network error",
            type: "error",
            message: "There was a problem reading gedcom: " + id
          };
          dispatch("notificationsAdd", notification, { root: true });
          return null;
        }
        let model = loadGedcom(xml, id, rootGetters.prefsGetReadItems);
        commit("GEDCOM_UPDATE_MODEL", model);
        return model;
      })
      .catch(error => {
        console.log("gedcomRead error", error);
        const notification = {
          error,
          type: "error",
          message: "There was a problem reading gedcom: " + id + " " + error.message
        };
        dispatch("notificationsAdd", notification, { root: true });
        throw error;
      });
  },
  gedcomReadData({ commit, dispatch, state, rootGetters }, id) {
    return readGedcomData(id)
      .then(xml => {
        // console.log("gedcomReadData success", xml);
        if (!xml || (xml.getAttribute("status") && xml.getAttribute("status") !== "0")) {
          const notification = {
            error: xml ? xml.getAttribute("status") : "network error",
            type: "error",
            message: "There was a problem reading gedcom: " + id
          };
          dispatch("notificationsAdd", notification, { root: true });
          return null;
        }
        let model = Object.assign(Object.create(Object.getPrototypeOf(state.model)), state.model);
        loadGedcomData(model, xml);
        modelLoaded(model, rootGetters.prefsGetReadItems);
        commit("GEDCOM_UPDATE_MODEL", model);
        return model;
      })
      .catch(error => {
        console.log("gedcomReadData error", error);
        const notification = {
          error,
          type: "error",
          message: "There was a problem reading gedcom data: " + id + " " + error.message
        };
        dispatch("notificationsAdd", notification, { root: true });
        throw error;
      });
  }
};

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

function createModelObjectFromContent(tag, content) {
  let endTag = "</" + tag + ">";
  let endPos = content.indexOf(endTag) + endTag.length;
  let root = parseXML(content.substr(0, endPos));
  let result = xmlToJson(root);
  result["#content"] = content.substr(endPos).trim();
  return result;
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

function setStdPersonAttrs(person) {
  person["@stdDate"] = getDateSortKey((getEventFact(person, "Birth") || {})["@date"]);
  person["@stdDeathDate"] = getDateSortKey((getEventFact(person, "Death") || {})["@date"]);
  person["@stdName"] = getPersonFullName(person).toLowerCase();
}

function setStdFamilyAttrs(family) {
  family["@stdHusbandName"] = getFullName(family["husband"] ? family["husband"][0] : null).toLowerCase();
  family["@stdWifeName"] = getFullName(family["wife"] ? family["wife"][0] : null).toLowerCase();
  family["@stdName"] = family["@stdHusbandName"] + " and " + family["@stdWifeName"];
  family["@stdDate"] = getDateSortKey((getEventFact(family, "Marriage") || {})["@date"]);
}

function setStdMySourceAttrs(mysource) {
  mysource["@stdName"] = getMySourceName(mysource, null).toLowerCase();
  mysource["@stdAuthor"] = (mysource["author"] && mysource["author"][0]["#text"]
    ? mysource["author"][0]["#text"]
    : ""
  ).toLowerCase();
}

function copyData(target, source) {
  for (let key in target) {
    if (target.hasOwnProperty(key)) {
      delete target[key];
    }
  }
  for (let key in source) {
    if (!key.startsWith("@") && source.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
}

function updateData(model, data, text) {
  let ns = +data["@ns"];
  if (ns === NS_PERSON) {
    let result = createModelObjectFromContent("person", text);
    copyData(data, result);
    setStdPersonAttrs(data);
  } else if (ns === NS_FAMILY) {
    let result = createModelObjectFromContent("family", text);
    copyData(data, result);
    setStdFamilyAttrs(data);
  } else if (ns === NS_MYSOURCE) {
    let result = createModelObjectFromContent("mysource", text);
    copyData(data, result);
    setStdMySourceAttrs(data);
  }
  itemUpdated(model, data);
}

function loadGedcom(elm, gedcomId, prefsGetReadItems) {
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

function loadGedcomData(model, elm) {
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
      data["@living"] = getTrueFalse(row.getAttribute("merged"));
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

function modelLoaded(model, prefsGetReadItems) {
  updateRootDistances(model);
  loadWarningsMatchesUpdates(model, prefsGetReadItems);
  updateCounts(model);

  if (model.status === STATUS_HOLD) {
    // TODO
    // ExternalInterface.call("loadContent", "/wiki/"+Utils.encodeWikiURIComponent("User_talk:"+model.userName));
  }
}

function setStatus(model, status) {
  model.status = +status;
  updateFlags(model);
}
