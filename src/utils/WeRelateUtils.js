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
  NAME_MATCH_THRESHOLD,
  STATUS_HOLD,
  HELPPAGES,
  prepareFindAddData,
  getGedcomPageTitle,
  getDefaultComponent,
  getPrefixedTitle,
  getPositiveNegative,
  getDataComponent,
  getWarningPersonFamily,
  itemUpdated,
  matchRelatedFamilies,
  preparePageData
} from "@/utils/ModelUtils.js";
import { encodeWikiURIComponent, objectToQuery } from "@/utils/StringUtils";
import { sendPageData, updateGedcomFlag } from "@/services/Server.js";
import { loadContent, loadContentNewWindow } from "@/services/ExternalInterface";

export function visitUserTalk(model) {
  loadPageTitle("User talk:" + model.userName);
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

export function findAddItem(model, data, component) {
  if (!model.isUpdatable) {
    return false;
  }
  if (+data["@ns"] === NS_FAMILY || +data["@ns"] === NS_PERSON) {
    let findAddData = prepareFindAddData(model, data);
    sendPageData(findAddData).then(result => {
      if (result && !result["@status"]) {
        let parms = {};
        parms.ns = NAMESPACES[+data["@ns"]];
        parms.match = "on";
        parms.pagetitle = getGedcomPageTitle(model, data);
        parms.gedcomtab = getDefaultComponent(+data["@ns"]);
        parms.gedcomkey = data["@id"];
        loadPageTitle("Special:Search", parms);
      } else {
        // TODO
        //  wr.statusError(result);
      }
    });
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

export function mergeItem(model, data) {
  if (!model.isUpdatable) {
    return false;
  }
  let findAddData = prepareFindAddData(model, data);
  sendPageData(findAddData).then(result => {
    if (result && !result["@status"]) {
      let parms = {};
      parms.gedcom = "true";
      parms.formAction = "Merge";
      parms.ns = NAMESPACES[+data["@ns"]];
      parms.maxpages = 2;
      parms.m_0 = getGedcomPageTitle(data);
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
      // TODO
      // wr.statusError(result);
    }
  });
  return true;
}

export function addMerge(model, ref, lhs, rhs, parms) {
  let person = model.personMap[ref["@id"]];
  if (person && person["@match"]) {
    parms[lhs] = getGedcomPageTitle(model, person);
    parms[rhs] = person["@match"];
    return true;
  }
  return false;
}

export function compareItem(model, data) {
  if (!model.isUpdatable) {
    return false;
  }
  let compareData = prepareFindAddData(model, data);
  sendPageData(compareData).then(result => {
    if (result && !result["@status"]) {
      let parms = {};
      parms.ns = NAMESPACES[+data["@ns"]];
      parms.compare = getGedcomPageTitle(model, data) + "|" + data["@matches"];
      parms.gedcomtab = MATCHES;
      parms.gedcomkey = data["@id"];
      loadPageTitle("Special:Compare", parms);
      // TODO
      // tac.showTip(model.gedcomId, TipAlertController.MATCH);
    } else {
      // TODO
      // wr.statusError(result);
    }
  });
}

export function fetchGedcomItem(model, data) {
  loadPageData(model, data);
}

export function fetchWeRelateItem(data) {
  let ns = +data["@ns"];
  if (ns === NS_MYSOURCE) ns = NS_SOURCE;
  loadPageTitle(NAMESPACES[ns] + ":" + data["@match"]);
}

export function unlinkItem(model, data) {
  if (+data["@ns"] === NS_PERSON) {
    setMatch(model, data, "");
  } else {
    // TODO
    // uc.show(data);
  }
}

export function fetchItem(model, data, component) {
  if (data) {
    if (component === PEOPLE || component === FAMILIES) {
      fetchGedcomItem(model, data);
    } else if (component === SOURCES) {
      if (!model.isMatchable) {
        loadPageTitle(NOT_MATCHABLE_PAGE);
      } else if (data["@match"]) {
        fetchWeRelateItem(data);
      } else {
        fetchGedcomItem(model, data);
      }
    } else if (component === WARNINGS) {
      fetchGedcomItem(model, getWarningPersonFamily(data));
    } else if (component === PLACES) {
      if (!model.isMatchable) {
        loadPageTitle(NOT_MATCHABLE_PAGE);
      } else if (data["@match"]) {
        fetchWeRelateItem(data);
      } else {
        findAddItem(model, data, component);
      }
    } else {
      // MATCHES
      if (!model.isMatchable) {
        loadPageTitle(NOT_MATCHABLE_PAGE);
      } else if (data["@match"]) {
        if (model.isMergeable && data["@merged"] !== "true") {
          mergeItem(model, data);
        } else {
          fetchWeRelateItem(data);
        }
      } else if (data["@matches"]) {
        compareItem(model, data);
      } else {
        // should never happen
        findAddItem(model, data, component);
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
  console.log("loadPageTitle", pageTitle, url);
  if (newWindow) {
    loadContentNewWindow(url);
  } else {
    loadContent(url);
  }
}

export function loadPageData(model, data) {
  let clone = preparePageData(model, data); // DON"T set find/add to true; if you do you won"t be able to edit
  // send data to WeRelate
  sendPageData(clone).then(result => {
    if (result && !result["@status"]) {
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
      // TODO
      // wr.statusError(result);
    }
  });
}

function setMatch(model, data, title, save = true, merged = false) {
  let datas = [];
  datas.push(data);
  let titles = [];
  titles.push(title);
  setMatches(model, datas, titles, save, merged);
}

function setMatches(model, datas, titles, save = true, merged = false, handleRelatedMatches = null) {
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
    itemUpdated(datas[i]);
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
    if (mergeIds.length > 0) saveMerged(model, mergedTF, mergeIds);
    if (matchIds.length > 0) {
      saveMatches(model, prefixedTitles, toBeMerged, matchIds, handleRelatedMatches);
    } else {
      handleRelatedMatches([], []);
    }
  }
}

export function setMatchHelperFields(result) {
  result["@stdMatch"] = result["@nomatch"] === "true" ? NOMATCH : result["@match"].toLowerCase();
}

function saveFlag(model, attr, value, keys) {
  updateGedcomFlag(model.gedcomId, attr, value, keys).then(result => {
    if (!result || result["@status"]) {
      // TODO
      // wr.statusError(result);
    }
  });
}

// function saveExclude(model, tf, ids) {
//   saveFlag("exclude", getPositiveNegative(tf), ids);
// }

// function saveLiving(model, tf, ids) {
//   saveFlag("living", getPositiveNegative(tf), ids);
// }

function saveMerged(model, tf, ids) {
  saveFlag("merged", getPositiveNegative(tf), ids);
}

// gets potential matches back and saves them
function saveMatches(model, prefixedTitles, merged, keys, handleRelatedMatches) {
  saveMatches(model.gedcomId, prefixedTitles, merged, keys).then(result => {
    let matchedTitles = [];
    let matchedFamilies = [];
    if (!result || result["@status"]) {
      // TODO
      // wr.statusError(result);
    } else {
      // process match results
      for (let match of result.match) {
        let id = match["@id"];
        let dataComponent = getDataComponent(id);
        if (dataComponent && dataComponent.component === PEOPLE) {
          matchRelatedFamilies(dataComponent.data, match, NAME_MATCH_THRESHOLD, matchedFamilies, matchedTitles);
        }
      }
      if (handleRelatedMatches) {
        handleRelatedMatches(matchedFamilies, matchedTitles);
      }
    }
  });
}
