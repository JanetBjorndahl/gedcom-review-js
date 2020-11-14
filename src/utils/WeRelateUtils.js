import {
  NS_FAMILY,
  NS_PERSON,
  NAMESPACES,
  NS_MYSOURCE,
  NS_PLACE,
  NS_SOURCE,
  MATCHES,
  NOMATCH,
  PEOPLE,
  FAMILIES,
  SOURCES,
  WARNINGS,
  PLACES,
  NOT_MATCHABLE_PAGE,
  STATUS_HOLD,
  HELPPAGES,
  NAME_MATCH_THRESHOLD,
  getGedcomPageTitle,
  getDefaultComponent,
  itemUpdated,
  getDataComponent,
  getEventFact,
  getPrefixedTitle,
  getReferences,
  preparePageData,
  setMatchHelperFields,
  updateData,
  getUnprefixedTitle,
  getWarningPersonFamily,
  getFullName
} from "@/utils/ModelUtils";
import {
  saveMatchedFamily,
  sendPageData,
  updateGedcomFlag,
  readGedcomPageData,
  saveMatchesToServer,
  savePotentialMatches,
  updateGedcomStatus
} from "@/services/Server";
import { encodeWikiURIComponent, objectToQuery, similarity } from "@/utils/StringUtils";
import { loadContent, loadContentNewWindow } from "@/services/ExternalInterface";
import { excludeItem, includeItem } from "@/utils/IncludeExclude";
import { xmlToJson } from "@/utils/XMLUtils";

const RESULT_NOMATCH = 0;
const RESULT_MATCH = 1;
const RESULT_MERGE = 2;

let sentData = null;

// async function unlinkItem(model, data) {
//   if (+data["@ns"] === NS_PERSON) {
//     await setMatch(model, data, "");
//   } else {
//     // TODO
//     // uc.show(data);
//   }
// }

export function visitUserTalk(model) {
  loadPageTitle("User talk:" + model.userName);
}

export async function fetchItem(model, data, component) {
  if (data) {
    if (component === PEOPLE || component === FAMILIES) {
      await fetchGedcomItem(model, data);
    } else if (component === SOURCES) {
      if (!model.isMatchable) {
        loadPageTitle(NOT_MATCHABLE_PAGE);
      } else if (data["@match"]) {
        fetchWeRelateItem(data);
      } else {
        await fetchGedcomItem(model, data);
      }
    } else if (component === WARNINGS) {
      await fetchGedcomItem(model, getWarningPersonFamily(data));
    } else if (component === PLACES) {
      if (!model.isMatchable) {
        loadPageTitle(NOT_MATCHABLE_PAGE);
      } else if (data["@match"]) {
        fetchWeRelateItem(data);
      } else {
        await findAddItem(model, data, component);
      }
    } else {
      // MATCHES
      if (!model.isMatchable) {
        loadPageTitle(NOT_MATCHABLE_PAGE);
      } else if (data["@match"]) {
        if (model.isMergeable && data["@merged"] !== "true") {
          await mergeItem(model, data);
        } else {
          fetchWeRelateItem(data);
        }
      } else if (data["@matches"]) {
        await compareItem(model, data);
      } else {
        // should never happen
        await findAddItem(model, data, component);
      }
    }
  } else if (model.status === STATUS_HOLD && component === 1) {
    visitUserTalk();
  } else {
    loadPageTitle(HELPPAGES[component]);
  }
}

export function loadPageTitle(pageTitle, parms = null, newWindow = false) {
  let url = ""; // "https://" + WR_SERVER;
  if (parms) {
    url += "/w/index.php?title=" + encodeWikiURIComponent(pageTitle) + "&" + objectToQuery(parms);
  } else {
    url += "/wiki/" + encodeWikiURIComponent(pageTitle);
  }
  if (newWindow) {
    loadContentNewWindow(url);
  } else {
    loadContent(url);
  }
}

// function loadGedcomId(model, id) {
//   let dataComponent = getDataComponent(model, id);
//   if (dataComponent != null) {
//     // set selected tab and item
//     Utils.dispatchDynamicEvent("gedcom:setSelectedItem", {
//       data: dataComponent.data,
//       component: dataComponent.component
//     });
//     // select item
//     selectedItemUpdated(dataComponent.data, dataComponent.component);
//     fetchItem(dataComponent.data, dataComponent.component);
//   }
// }

export async function pageUpdated(model, id) {
  let result = await readGedcomPageData(model.gedcomId, id);
  result = xmlToJson(result);
  if (result && result["@status"] === "0") {
    let dataComponent = getDataComponent(model, result["@key"]);
    if (dataComponent && result["#text"]) {
      // get old mysource refs
      let oldMySources = getMySourceCitationIds(dataComponent.data);
      // update
      updateData(model, dataComponent.data, result["#text"]);
      // did the update make the person non-living?
      let deathDate = (getEventFact(dataComponent.data, "Death") || {})["@date"];
      let deathPlace = (getEventFact(dataComponent.data, "Death") || {})["@place"];
      let burialDate = (getEventFact(dataComponent.data, "Burial") || {})["@date"];
      let burialPlace = (getEventFact(dataComponent.data, "Burial") || {})["@place"];
      if (
        dataComponent.data["@living"] === "true" &&
        (isNonLiving(deathDate) || isNonLiving(deathPlace) || isNonLiving(burialDate) || isNonLiving(burialPlace))
      ) {
        await setLiving(model, dataComponent.data, "false");
      }

      dataComponent.data["@edited"] = "true";
      // get new mysource refs
      let newMySources = getMySourceCitationIds(dataComponent.data);
      await updateMySourceInclusion(model, oldMySources, newMySources);
    }
  } else {
    console.log("pageUpdated error", result);
    throw result;
  }
}

export async function updateStatus(model, status, warning) {
  let result = await updateGedcomStatus(model.gedcomId, status, warning);
  result = xmlToJson(result);
  if (!result || result["@status"] !== "0") {
    console.log("gedcomUpdateStatus error", result);
    throw result;
  }
  model.status = status;
}

export async function matchFound(model, title) {
  await setMatch(model, sentData, title);
}

export async function matchesFound(model, matchesString, merged, all) {
  matchesString = matchesString.trim();
  if (matchesString.length > 0) {
    let matches = matchesString.split("\n");
    let datas = [];
    let titles = [];
    for (let match of matches) {
      let success = false;
      let fields = match.split("|", 2);
      if (fields.length === 2) {
        let title = fields[0];
        let dataComponent = getDataComponent(model, fields[1]);
        if (title && dataComponent) {
          let data = dataComponent.data;
          datas.push(data);
          titles.push(title);
          success = true;
        }
      }
      if (!success) {
        throw { message: 'Invalid match: please contact dallan@werelate.org", "Unable to process match' };
      }
    }
    if (datas.length > 0) {
      await setMatches(model, datas, titles, true, merged, all ? matchRelatedMatches : addRelatedMatches);
    }
  } else {
    // got a nomatch
    await setMatch(model, sentData, ""); // clear potential matches
    await fetchMatchedItem(model, sentData, RESULT_NOMATCH);
  }
}

export async function setExclude(model, data, exclude) {
  let updatedItems = [];
  if (exclude === "true") {
    excludeItem(model, data, updatedItems);
  } else {
    includeItem(model, data, updatedItems);
  }
  let saveKeys = [];
  for (let item of updatedItems) {
    itemUpdated(model, item);
    saveKeys.push(item["@id"]);
  }
  if (saveKeys.length > 0) {
    await saveExclude(model, exclude, saveKeys);
  }
}

export async function unmatch(model, data) {
  if (+data["@ns"] === NS_FAMILY) {
    let datas = [model.familyMap[data["@id"]]];
    let titles = [""];
    for (let ref of data["husband"] || []) {
      let member = model.personMap[ref["@id"]];
      datas.push(member);
      titles.push("");
    }
    for (let ref of data["wife"] || []) {
      let member = model.personMap[ref["@id"]];
      datas.push(member);
      titles.push("");
    }
    for (let ref of data["child"] || []) {
      let member = model.personMap[ref["@id"]];
      datas.push(member);
      titles.push("");
    }
    await setMatches(model, datas, titles);
  } else {
    await setMatch(model, data, "");
  }
}

//
// local functions
//

function isNonLiving(s) {
  return s && s.length > 0 && s.toLowerCase() !== "living" && s.toLowerCase() !== "private";
}

async function addRelatedMatches(model, merged, matchedFamilies, matchedTitles) {
  await fetchMatchedItem(model, sentData, merged ? RESULT_MERGE : RESULT_MATCH);
  if (matchedFamilies.length > 0) {
    await setPotentialMatches(model, matchedFamilies, matchedTitles);
  }
}

async function matchRelatedMatches(model, merged, matchedFamilies, matchedTitles) {
  await fetchMatchedItem(model, sentData, merged ? RESULT_MERGE : RESULT_MATCH);

  let familyMatches = [];
  for (let i = 0; i < matchedTitles.length; i++) {
    familyMatches.push(getFamilyMatch(matchedFamilies[i], matchedTitles[i]));
  }
  await startMatching(model, familyMatches);
}

async function setMatch(model, data, title, save = true, merged = false) {
  let datas = [];
  datas.push(data);
  let titles = [];
  titles.push(title);
  await setMatches(model, datas, titles, save, merged);
}

async function setMatches(model, datas, titles, save = true, merged = false, handleRelatedMatches = null) {
  let matchIds = [];
  let mergeIds = [];
  let toBeMerged = [];
  let prefixedTitles = [];
  let mergedTF = merged ? "true" : "false";
  for (let i = 0; i < datas.length; i++) {
    let matchDiffers = datas[i]["@match"] !== titles[i];
    datas[i]["@match"] = titles[i];
    let mergeDiffers = datas[i]["@merged"] !== mergedTF;
    // if matching the same title and already merged, keep merged
    if (titles[i] && !matchDiffers && datas[i]["@merged"] === "true" && !merged) {
      mergeDiffers = false;
    } else {
      datas[i]["@merged"] = mergedTF;
    }
    if (!titles[i]) {
      datas[i]["@nomatch"] = "true";
      datas[i]["@matches"] = datas[i]["@gedcomMatches"]; // reset title also resets pot matches to original matches
    } else {
      datas[i]["@nomatch"] = "";
    }
    setMatchHelperFields(datas[i]);
    itemUpdated(model, datas[i]);
    if (save) {
      // if !merged, we want to push up all titles, even pre-matched/merged titles,
      // so we get relatives back for handleRelatedMatches
      if (matchDiffers || !merged) {
        if (!titles[i]) {
          prefixedTitles.push(NOMATCH);
        } else {
          // !!! hack - shouldn"t assume that all MySource matches are Source"s
          prefixedTitles.push(
            getPrefixedTitle(+datas[i]["@ns"] === NS_MYSOURCE ? NS_SOURCE : datas[i]["@ns"], titles[i])
          );
        }
        matchIds.push(datas[i]["@id"]);
        toBeMerged.push(datas[i]["@merged"]);
      } else if (mergeDiffers) {
        mergeIds.push(datas[i]["@id"]);
      }
    }
  }
  if (save) {
    if (mergeIds.length > 0) {
      await saveMerged(model, mergedTF, mergeIds);
    }
    if (matchIds.length > 0) {
      await saveMatches(model, merged, prefixedTitles, toBeMerged, matchIds, handleRelatedMatches);
    } else {
      await handleRelatedMatches(model, merged, [], []);
    }
  }
}

async function saveFlag(model, attr, value, keys) {
  let result = await updateGedcomFlag(model.gedcomId, attr, value, keys);
  result = xmlToJson(result);
  if (!result || result["@status"] !== "0") {
    console.log("saveFlag error", result);
    throw result;
  }
}

async function saveExclude(model, tf, ids) {
  await saveFlag(model, "exclude", getPositiveNegative(tf), ids);
}

async function saveLiving(model, tf, ids) {
  await saveFlag(model, "living", getPositiveNegative(tf), ids);
}

async function setLiving(model, data, living) {
  data["@living"] = living;
  itemUpdated(data);
  await saveLiving(model, data["@living"], data["@id"]);
  if (+data["@ns"] === NS_PERSON) {
    for (let ref of data["spouse_of_family"]) {
      let family = model.familyMap[ref["@id"]];
      if (family) {
        let familyIsLiving = "false";
        for (let spouseRef of family["husband"]) {
          let spouse = model.personMap[spouseRef["@id"]];
          if (spouse && spouse["@living"] === "true") familyIsLiving = "true";
        }
        for (let spouseRef of family["wife"]) {
          let spouse = model.personMap[spouseRef["@id"]];
          if (spouse && spouse["@living"] === "true") familyIsLiving = "true";
        }
        if (family["@living"] !== familyIsLiving) {
          await setLiving(model, family, familyIsLiving);
        }
      }
    }
  }
}

async function saveMerged(model, tf, ids) {
  await saveFlag(model, "merged", getPositiveNegative(tf), ids);
}

// gets potential matches back and saves them
async function saveMatches(model, merged, prefixedTitles, mergedIds, keys, handleRelatedMatches) {
  let result = await saveMatchesToServer(model.gedcomId, prefixedTitles, mergedIds, keys);
  result = xmlToJson(result);
  if (!result || result["@status"] !== "0") {
    console.log("saveMatches error", result);
    throw result;
  } else {
    // process match results
    let matchedTitles = [];
    let matchedFamilies = [];
    for (let match of result["match"] || []) {
      let id = match["@id"];
      let dataComponent = getDataComponent(model, id);
      if (dataComponent && dataComponent.component === PEOPLE) {
        matchRelatedFamilies(model, dataComponent.data, match, NAME_MATCH_THRESHOLD, matchedFamilies, matchedTitles);
      }
    }
    if (handleRelatedMatches) {
      await handleRelatedMatches(model, merged, matchedFamilies, matchedTitles);
    }
  }
}

// async function setPotentialMatch(model, data, title, save = true) {
//   let datas = [];
//   datas.push(data);
//   let titles = [];
//   titles.push(title);
//   await setPotentialMatches(model, datas, titles, save);
// }

async function setPotentialMatches(model, datas, titles, save = true) {
  let ids = [];
  for (let i = 0; i < datas.length; i++) {
    datas[i]["@matches"] = titles[i].length > 0 ? titles[i] : datas[i]["@gedcomMatches"];
    setMatchHelperFields(datas[i]);
    itemUpdated(datas[i]);
    if (save) {
      ids[i] = datas[i]["@id"];
    }
  }
  if (save) {
    let result = await savePotentialMatches(model.gedcomId, titles, ids);
    if (!result || result["@status"] !== "0") {
      console.log("setPotentialMatches error", result);
      throw result;
    }
  }
}

function getFamilyMatch(data, title) {
  return title + "|" + data["@id"];
}

async function matchFamily(model, familyMatches, family, title) {
  let matchData = prepareFindAddData(model, family);
  matchData["@match"] = title;
  matchData["@id"] = family["@id"];
  let result = await saveMatchedFamily(matchData);
  result = xmlToJson(result);
  if (!result || result["@status"] !== "0") {
    console.log("matchFamily error", result);
    throw result;
  }
  let matchedFamilies = [];
  let matchedFamilyTitles = [];
  let matchedPF = [];
  let unmatchedPF = [];
  let matchedPFTitles = [];
  let unmatchedPFTitles = [];
  for (let match of result.match) {
    let id = match["@id"];
    let dataComponent = getDataComponent(model, id);
    let pf = dataComponent.data;
    // set match or potential matches
    if (match["@match"]) {
      matchedPF.push(pf);
      matchedPFTitles.push(getUnprefixedTitle(match["@match"]));
      // for matching people, read relatives + get related families
      if (dataComponent.component === PEOPLE) {
        matchRelatedFamilies(model, pf, match, NAME_MATCH_THRESHOLD, matchedFamilies, matchedFamilyTitles);
      }
    } else if (match["@matches"]) {
      unmatchedPF.push(pf);
      unmatchedPFTitles.push(match["@matches"]);
    }
  }
  // set match or potential matches
  if (matchedPF.length > 0) {
    await setMatches(matchedPF, matchedPFTitles, false);
  }
  if (unmatchedPF.length > 0) {
    await setPotentialMatches(unmatchedPF, unmatchedPFTitles, false);
  }

  // post related families on stack
  for (let i = 0; i < matchedFamilies.length; i++) {
    familyMatches.push(getFamilyMatch(matchedFamilies[i], matchedFamilyTitles[i]));
  }
}

async function startMatching(model, familyMatches) {
  while (familyMatches.length > 0) {
    let match = familyMatches.pop();
    let fields = match.split("|", 2);
    let title = fields[0];
    let family = model.familyMap[fields[1]];
    if (family["@exclude"] !== "true" && family["@living"] !== "true" && !family["@match"]) {
      await matchFamily(model, familyMatches, family, title);
    }
  }
}

async function updateMySourceInclusion(model, oldMySources, newMySources) {
  // for each added mysource ref, make sure it's included
  for (let id of newMySources) {
    if (!oldMySources.contains(id)) {
      let ms = model.sourceMap[id];
      if (ms && ms["@exclude"] === "true") {
        // include ms
        await setExclude(model, ms, "false");
      }
    }
  }
  // for each removed mysource ref, exclude it if no other refs
  for (let id of oldMySources) {
    if (!newMySources.contains(id)) {
      let ms = model.sourceMap[id];
      if (ms && ms["@exclude"] !== "true" && getReferences(model, ms).length === 0) {
        // exclude ms
        await setExclude(model, ms, "true");
      }
    }
  }
}

// remove beginning and trailing , spaces
function trimPlace(s) {
  return s.replace(/^[ ,]+|[ ,]+$/g, "");
}

function getPlaceNameLocatedIn(data) {
  let place = trimPlace(data["@text"]);
  let locatedIn = "";
  let pos = place.indexOf(",");
  if (pos > 0) {
    locatedIn = trimPlace(place.substr(pos + 1));
    place = trimPlace(place.substr(0, pos));
  }
  return [place, locatedIn];
}

async function findAddItem(model, data, component) {
  if (!model.isUpdatable) {
    return false;
  }
  sentData = data;
  if (+data["@ns"] === NS_FAMILY || +data["@ns"] === NS_PERSON) {
    let findAddData = prepareFindAddData(model, data);
    let result = await sendPageData(findAddData);
    result = xmlToJson(result);
    if (result && result["@status"] === "0") {
      let parms = {};
      parms.ns = NAMESPACES[+data["@ns"]];
      parms.match = "on";
      parms.pagetitle = getGedcomPageTitle(model, data);
      parms.gedcomtab = getDefaultComponent(+data["@ns"]);
      parms.gedcomkey = data["@id"];
      loadPageTitle("Special:Search", parms);
    } else {
      console.log("findAddItem error", result);
      throw result;
    }
  } else if (+data["@ns"] === NS_MYSOURCE || +data["@ns"] === NS_PLACE) {
    let parms = {};
    parms.namespace = +data["@ns"];
    if (+data["@ns"] === NS_MYSOURCE) {
      parms.namespace = NS_SOURCE;
      parms.st = data["title"] && data["title"][0]["#text"] ? data["title"][0]["#text"] : "";
      parms.a = data["author"] && data["author"][0]["#text"] ? data["author"][0]["#text"] : "";
    } else if (+data["@ns"] === NS_PLACE) {
      let fields = getPlaceNameLocatedIn(data);
      parms.pn = fields[0];
      parms.li = fields[1];
    }
    parms.target = "gedcom";
    parms.gedcomtab = component;
    parms.gedcomkey = data["@id"];
    loadPageTitle("Special:AddPage", parms);
    // TODO
    // tac.showTip(model.gedcomId, data.@ns === NS_MYSOURCE ? TipAlertController.FIND_ADD_SOURCE
    //   : TipAlertController.FIND_ADD_PLACE);
  }
  return true;
}

async function mergeItem(model, data) {
  if (!model.isUpdatable) {
    return false;
  }
  sentData = data;
  let findAddData = prepareFindAddData(model, data);
  let result = await sendPageData(findAddData);
  result = xmlToJson(result);
  if (result && result["@status"] === "0") {
    let parms = {};
    parms.gedcom = "true";
    parms.formAction = "Merge";
    parms.ns = NAMESPACES[+data["@ns"]];
    parms.maxpages = 2;
    parms.m_0 = getGedcomPageTitle(model, data);
    parms.m_1 = data["@match"];
    if (+data["@ns"] === NS_FAMILY) {
      for (let node of data["husband"] || []) {
        addMerge(model, node, "mh_0", "mh_1", parms);
      }
      for (let node of data["wife"] || []) {
        addMerge(model, node, "mw_0", "mw_1", parms);
      }
      let numChildren = 0;
      for (let node of data["child"] || []) {
        if (addMerge(model, node, "mc_0_" + numChildren, "mc_1_" + numChildren, parms)) {
          parms["mcr_0_" + numChildren] = numChildren + 1;
          parms["mcr_1_" + numChildren] = numChildren + 1;
          numChildren++;
        }
      }
      parms.maxchildren = numChildren;
    }
    parms.gedcomtab = MATCHES;
    parms.gedcomkey = data["@id"];
    loadPageTitle("Special:Merge", parms);
    // TODO
    // if (!uc.isVisible()) {
    //   tac.showTip(model.gedcomId, TipAlertController.MERGE);
    // }
  } else {
    console.log("mergeItem error", result);
    throw result;
  }
  return true;
}

function addMerge(model, ref, lhs, rhs, parms) {
  let person = model.personMap[ref["@id"]];
  if (person && person["@match"]) {
    parms[lhs] = getGedcomPageTitle(model, person);
    parms[rhs] = person["@match"];
    return true;
  }
  return false;
}

async function compareItem(model, data) {
  if (!model.isUpdatable) {
    return false;
  }
  sentData = data;
  let compareData = prepareFindAddData(model, data);
  let result = await sendPageData(compareData);
  result = xmlToJson(result);
  if (result && result["@status"] === "0") {
    let parms = {};
    parms.ns = NAMESPACES[+data["@ns"]];
    parms.compare = getGedcomPageTitle(model, data) + "|" + data["@matches"];
    parms.gedcomtab = MATCHES;
    parms.gedcomkey = data["@id"];
    loadPageTitle("Special:Compare", parms);
    // TODO
    // tac.showTip(model.gedcomId, TipAlertController.MATCH);
  } else {
    console.log("compareItem error", result);
    throw result;
  }
}

async function fetchGedcomItem(model, data) {
  await loadPageData(model, data);
}

async function fetchMatchedItem(model, sentData, matchResult) {
  if (sentData) {
    if (matchResult === RESULT_MERGE) {
      // don't do anything
    } else if (matchResult === RESULT_MATCH) {
      await fetchItem(model, sentData, MATCHES);
    } else {
      // RESULT_NOMATCH
      await fetchGedcomItem(model, sentData);
    }
  }
}

async function loadPageData(model, data) {
  let clone = preparePageData(model, data); // DON"T set find/add to true; if you do you won"t be able to edit
  sentData = data;
  // send data to WeRelate
  let result = await sendPageData(clone);
  result = xmlToJson(result);
  if (result && result["@status"] === "0") {
    let parms = {};
    parms.gedcomtab = getDefaultComponent(+data["@ns"]);
    parms.gedcomkey = data["@id"];
    parms.gedcomid = model.gedcomId;
    // only admins can edit pages that aren't mergeable
    if (model.isUpdatable && (model.isMergeable || model.isAdmin)) {
      parms.editable = "true";
    }
    loadPageTitle("Special:GedcomPage", parms);
  } else {
    console.log("loadPageData error", result);
    throw result;
  }
}

function matchRelatedFamilies(model, person, match, threshold, matchedFamilies, matchedTitles) {
  // compare parents
  let families = [];
  let matchTitles = [];
  for (let ref of person["child_of_family"] || []) {
    let family = model.familyMap[ref["@id"]];
    if (family) families.push(family);
  }
  for (let matchingFamily of match["child_of_family"] || []) {
    matchTitles.push(matchingFamily["@title"]);
  }
  compareFamilies(model, matchTitles, families, person, false, threshold, matchedFamilies, matchedTitles);

  // compare spouses
  families = [];
  matchTitles = [];
  for (let ref of person["spouse_of_family"] || []) {
    let family = model.familyMap[ref["@id"]];
    if (family) families.push(family);
  }
  for (let matchingFamily of match["spouse_of_family"] || []) {
    matchTitles.push(matchingFamily["@title"]);
  }
  compareFamilies(model, matchTitles, families, person, true, threshold, matchedFamilies, matchedTitles);
}

function getMySourceCitationIds(data) {
  let ids = [];
  for (let sc of data["source_citation"] || []) {
    let id = sc["@source_id"];
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

function prepareFindAddData(model, data) {
  let result = { family: [], person: [] };
  result["@gedcomId"] = model.gedcomId;
  let clone = preparePageData(model, data, true);
  if (+clone["@ns"] === NS_PERSON) {
    result["person"].push(clone);
    for (let node of clone["child_of_family"] || []) {
      addFamily(model, node["@id"], clone["@id"], result);
    }
    for (let node of clone["spouse_of_family"] || []) {
      addFamily(model, node["@id"], clone["@id"], result);
    }
  } else if (+clone["@ns"] === NS_FAMILY) {
    result["family"].push(clone);
    for (let node of clone["husband"] || []) {
      let member = model.personMap[node["@id"]];
      if (member) result["person"].push(preparePageData(model, member, true));
    }
    for (let node of clone["wife"] || []) {
      let member = model.personMap[node["@id"]];
      if (member) result["person"].push(preparePageData(model, member, true));
    }
    for (let node of clone["child"] || []) {
      let member = model.personMap[node["@id"]];
      if (member) result["person"].push(preparePageData(model, member, true));
    }
  }
  return result;
}

function addFamily(model, familyId, selfId, result) {
  let family = model.familyMap[familyId];
  if (family) {
    result["family"].push(preparePageData(model, family, true));
    for (let ref of family["husband"] || []) {
      let member = model.personMap[ref["@id"]];
      if (member && member["@id"] !== selfId) result["person"].push(preparePageData(model, member, true));
    }
    for (let ref of family["wife"] || []) {
      let member = model.personMap[ref["@id"]];
      if (member && member["@id"] !== selfId) result["person"].push(preparePageData(model, member, true));
    }
  }
}

function compareFamilies(model, matchTitles, families, data, isSpouse, threshold, matchedFamilies, matchedTitles) {
  let matched = [];
  for (let i = 0; i < families.length; i++) {
    let bestScore = 0;
    let bestTitle = -1;
    for (let j = 0; j < matchTitles.length; j++) {
      if (!matched[j]) {
        let score = compareFamily(model, matchTitles[j], families[i], data, isSpouse, threshold);
        if (score > bestScore) {
          bestScore = score;
          bestTitle = j;
        } else if (score > 0 && score === bestScore) {
          // don't match either if >1 title with same score
          bestTitle = -1;
        }
      }
    }
    if (bestTitle >= 0) {
      matchedFamilies.push(families[i]);
      matchedTitles.push(matchTitles[bestTitle]);
      matched[bestTitle] = true;
    }
  }
}

function compareFamily(model, matchingTitle, family, data, isSpouse, threshold) {
  let score = 0;
  let pattern = /(.*)\s+and\s+(.*)\s+\(\d+\)/i;
  let result = pattern.exec(matchingTitle);
  if (result != null) {
    let matchingHusbandName = result[1];
    let husband = family["husband"] ? model.personMap[family["husband"][0]["@id"]] : null;
    let husbandName = husband && husband["name"] ? getFullName(husband["name"][0]) : "";
    if (!isSpouse || (data["gender"] && data["gender"][0]["#text"] === "F")) {
      score += compareNames(matchingHusbandName, husbandName, threshold);
    }

    let matchingWifeName = result[2];
    let wife = family["wife"] ? model.personMap[family["wife"][0]["@id"]] : null;
    let wifeName = wife && wife["name"] ? getFullName(wife["name"][0]) : "";
    if (!isSpouse || (data["gender"] && data["gender"][0]["#text"] === "M")) {
      score += compareNames(matchingWifeName, wifeName, threshold);
    }
  }
  return score;
}

function compareNames(name1, name2, threshold) {
  let score = 0;
  name1 = name1.trim();
  name2 = name2.trim();
  if (name1.length > 0 && name2.length > 0) {
    let namePieces1 = name1.split(/[ ,\-']+/);
    let namePieces2 = name2.split(/[ ,\-']+/);
    for (let namePiece1 of namePieces1) {
      namePiece1 = namePiece1.toLowerCase();
      for (let namePiece2 of namePieces2) {
        namePiece2 = namePiece2.toLowerCase();
        if (namePiece1 === namePiece2) score += 2;
        else if (similarity(namePiece1, namePiece2) >= threshold) score += 1;
      }
    }
  }
  return score;
}

function getPositiveNegative(tf) {
  if (tf === "true") {
    return "1";
  } else if (tf === "false") {
    return "-1";
  }
  return "0";
}

function fetchWeRelateItem(data) {
  let ns = +data["@ns"];
  if (ns === NS_MYSOURCE) ns = NS_SOURCE;
  loadPageTitle(NAMESPACES[ns] + ":" + data["@match"]);
}
