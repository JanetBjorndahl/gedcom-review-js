import lodash from "lodash";

export const NS_SOURCE = 104;
export const NS_PLACE = 106;
export const NS_PERSON = 108;
export const NS_FAMILY = 110;
export const NS_MYSOURCE = 112;

export const NAMESPACES = {
  104: "Source",
  106: "Place",
  108: "Person",
  110: "Family",
  112: "MySource"
};

export const OVERVIEW = 1;
export const PEOPLE = 2;
export const FAMILIES = 3;
export const WARNINGS = 4;
export const PLACES = 5;
export const SOURCES = 6;
export const MATCHES = 7;
export const UPDATES = 8;
export const IMPORT = 9;

export const HELPPAGES = [
  "Help:Review_GEDCOM",
  "Help:Review_GEDCOM#Overview_Tab",
  "Help:Review_GEDCOM#People_Tab",
  "Help:Review_GEDCOM#Families_Tab",
  "Help:Review_GEDCOM#Warnings_Tab",
  "Help:Review_GEDCOM#Places_Tab",
  "Help:Review_GEDCOM#Sources_Tab",
  "Help:Review_GEDCOM#Family_Matches_Tab",
  "Help:Review_GEDCOM#Updates_Tab",
  "Help:Review_GEDCOM#Import_Tab"
];

export const NOT_MATCHABLE_PAGE = "Help:Review_GEDCOM/Not_Matchable";

export const STATUS_DELETE = 0;
export const STATUS_WAITING = 1;
export const STATUS_ANALYZING = 2;
export const STATUS_READY = 3;
export const STATUS_OPENED = 4;
export const STATUS_PHASE2 = 5;
export const STATUS_PHASE3 = 6;
export const STATUS_IMPORTING = 7;
export const STATUS_ADMIN_REVIEW = 8;
export const STATUS_HOLD = 19;

export const NOT_CONNECTED = 9999;

export const MAX_PEOPLE = 5100;

export const NOMATCH = "#nomatch#";

export const NAME_MATCH_THRESHOLD = 60;

export function getDefaultComponent(ns) {
  if (ns === NS_FAMILY) return FAMILIES;
  if (ns === NS_PERSON) return PEOPLE;
  if (ns === NS_MYSOURCE) return SOURCES;
  if (ns === NS_PLACE) return PLACES;
  return 0;
}

export function getDataComponent(model, id) {
  let data = model.personMap[id];
  if (data) {
    return { data, component: PEOPLE };
  }
  data = model.familyMap[id];
  if (data) {
    return { data, component: FAMILIES };
  }
  data = model.sourceMap[id];
  if (data) {
    return { data, component: SOURCES };
  }
  data = model.placeMap[id];
  if (data) {
    return { data, component: PLACES };
  }
  return null;
}

export function cleanName(name) {
  return name.replace(/[?~!@#$%^&*.()_+=/<>{}[\];:"\\,|]/g, " ").replace(/\s+/g, " ");
}

export function cleanWikiTitle(title) {
  title = title
    .replace(/[<[{]/g, "(")
    .replace(/[>\]}]/g, ")")
    .replace(/\|/g, "-")
    .replace(/_/g, " ")
    .replace(/#/g, "number ")
    .replace(/\?/g, " question ")
    .replace(/\+/g, " plus ")
    .replace(/%([0-9a-fA-F][0-9a-fA-F])/g, "% $1")
    .replace(/\s+/g, " ")
    .replace(/\/\/+/g, "/");
  title = title.trim();
  while (title.length > 0 && (title.startsWith(".") || title.startsWith("/"))) {
    title = title.substr(1);
  }
  if (title.length > 150) {
    title = title.substr(0, 149);
  }
  return capitalize(title);
}

export function getPrebarTitle(fullTitle) {
  let pos = fullTitle.indexOf("|");
  return pos > 0 ? fullTitle.substr(0, pos) : fullTitle;
}

export function getPersonFamilyData(model, id, ns) {
  return ns === NS_PERSON ? model.personMap[id] : model.familyMap[id];
}

export function getPrefixedTitle(ns, title) {
  if (title.indexOf(NAMESPACES[ns] + ":") !== 0) {
    return NAMESPACES[ns] + ":" + title;
  }
  return title;
}

export function getUnprefixedTitle(prefixedTitle) {
  for (let nsText of Object.values(NAMESPACES)) {
    if (prefixedTitle.startsWith(nsText + ":")) {
      return prefixedTitle.substr(nsText.length + 1);
    }
  }
  return prefixedTitle;
}

export function getFullName(name) {
  if (!name) {
    return "";
  }
  return (
    name["@surname"] +
    "," +
    (name["@title_prefix"] ? " " + name["@title_prefix"] : "") +
    (name["@given"] ? " " + name["@given"] : "") +
    (name["@title_suffix"] ? " " + name["@title_suffix"] : "")
  );
}

export function getPersonFullName(person) {
  if (!person) {
    return "";
  }
  return getFullName(person["name"] ? person["name"][0] : null);
}

export function getPersonTitle(person) {
  let name = "";
  if (person["@living"] === "true") {
    name = "Living";
  } else {
    name = person["name"] && person["name"][0]["@given"] ? person["name"][0]["@given"].trim() : "";
    let pos = name.indexOf(" ");
    if (pos > 0) {
      name = name.substr(0, pos);
    }
  }
  name = cleanName(name + " " + (person["name"] && person["name"][0]["@surname"] ? person["name"][0]["@surname"] : ""));
  return cleanWikiTitle(capitalize(name));
}

export function getFamilyTitle(husband, wife) {
  var title = "";
  title += husband ? getPersonTitle(husband) : "Unknown";
  title += " and ";
  title += wife ? getPersonTitle(wife) : "Unknown";
  return title;
}

export function getFamilyFullName(family) {
  return (
    getFullName(family["husband"] ? family["husband"][0] : null) +
    " and " +
    getFullName(family["wife"] ? family["wife"][0] : null)
  );
}

export function getPersonFamilyName(data) {
  if (+data["@ns"] === NS_PERSON) {
    return getPersonFullName(data);
  } else {
    return getFamilyFullName(data);
  }
}

export function getMySourceName(mysource, userName) {
  let title = "Source";
  if (mysource["title"] && mysource["title"][0]["#text"]) {
    title = mysource["title"][0]["#text"];
  } else if (mysource["abbrev"] && mysource["abbrev"][0]["#text"]) {
    title = mysource["abbrev"][0]["#text"];
  } else if (mysource["author"] && mysource["author"][0]["#text"]) {
    title = mysource["author"][0]["#text"];
    if (mysource["publication_info"] && mysource["publication_info"][0]["#text"]) {
      title += " " + mysource["publication_info"][0]["#text"];
    }
  }
  if (userName) {
    title = userName + "/" + title;
  }
  return cleanWikiTitle(title);
}

export function getReferences(model, data) {
  let references = [];

  for (let pf of model["people"] || []) {
    if (+data["@ns"] === NS_PLACE) {
      for (let ef of pf["event_fact"] || []) {
        if (getPrebarTitle(ef["@place"]) === data["@text"]) {
          references.push(pf);
          break;
        }
      }
    } else if (+data["@ns"] === NS_MYSOURCE) {
      for (let sc of pf["source_citation"] || []) {
        if (sc["@source_id"] === data["@id"]) {
          references.push(pf);
          break;
        }
      }
    }
  }

  for (let pf of model["families"] || []) {
    if (+data["@ns"] === NS_PLACE) {
      for (let ef of pf["event_fact"] || []) {
        if (getPrebarTitle(ef["@place"]) === data["@text"]) {
          references.push(pf);
          break;
        }
      }
    } else if (+data["@ns"] === NS_MYSOURCE) {
      for (let sc of pf["source_citation"] || []) {
        if (sc["@source_id"] === data["@id"]) {
          references.push(pf);
          break;
        }
      }
    }
  }

  return references;
}

export function getMySourceCitationIds(data) {
  let ids = [];
  for (let sc of data["source_citation"] || []) {
    let id = sc["@source_id"];
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
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

export function matchRelatedFamilies(model, person, match, threshold, matchedFamilies, matchedTitles) {
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

function getGedcomPersonTitle(person) {
  let title = getPersonTitle(person);
  if (person["@exclude"] === "true") {
    title += " - Excluded";
  }
  title += " (" + person["@id"] + " gedcom)";
  return title;
}

function getGedcomFamilyTitle(model, family) {
  let husband = family["husband"] ? model.personMap[family["husband"][0]["@id"]] : null;
  let wife = family["wife"] ? model.personMap[family["wife"][0]["@id"]] : null;
  let title = getFamilyTitle(husband, wife);
  if (family["@exclude"] === "true") {
    title += " - Excluded";
  }
  title += " (" + family["@id"] + " gedcom)";
  return title;
}

function getGedcomSourceTitle(model, source, findAdd = false) {
  if (findAdd && source["@match"]) {
    return "Source:" + source["@match"];
  } else {
    let title = "MySource:" + getMySourceName(source, model.userName);
    if (!findAdd) {
      if (source["@exclude"] === "true") {
        title += " - Excluded";
      }
      title += " (" + source["@id"] + " gedcom)";
    }
    return title;
  }
}

export function getGedcomPageTitle(model, data) {
  if (+data["@ns"] === NS_PERSON) {
    return getGedcomPersonTitle(data);
  } else if (+data["@ns"] === NS_FAMILY) {
    return getGedcomFamilyTitle(model, data);
  } else if (+data["@ns"] === NS_MYSOURCE) {
    return getGedcomSourceTitle(model, data);
  }
  return "";
}

export function getGedcomKey(pageTitle) {
  if (pageTitle != null) {
    let start = pageTitle.lastIndexOf("(");
    let end = pageTitle.lastIndexOf(" gedcom)");
    if (start >= 0 && end > start) return pageTitle.substr(start + 1, end - start - 1);
  }
  return null;
}

function standardizePlace(model, placeText) {
  let place = model.placeTextMap[placeText];
  if (place) {
    let std = place["@match"];
    if (place["@nomatch"] === "true") {
      return placeText;
    } else if (!std) {
      return place["@bestMatch"] + "|" + placeText;
    } else {
      return std + "|" + placeText;
    }
  } else {
    return placeText;
  }
}

function updatePersonRef(model, ref, findAdd) {
  let person = model.personMap[ref["@id"]];
  if (person) {
    ref["@title"] = getGedcomPersonTitle(person);
    if (findAdd && person["@match"]) {
      // pass up match title separately
      ref["@match"] = person["@match"];
    }
    if (person["@exclude"] === "true") {
      ref["@title_suffix"] += " - Excluded";
      if (findAdd) ref["@exclude"] = "true";
    }
    if (person["@living"] === "true") {
      ref["@given"] = "Living";
      ref["@title_prefix"] = "";
      ref["@title_suffix"] = "";
      ref["@birthdate"] = "";
      ref["@birthplace"] = "";
      ref["@chrdate"] = "";
      ref["@chrplace"] = "";
      ref["@deathdate"] = "";
      ref["@deathplace"] = "";
      ref["@burialdate"] = "";
      ref["@burialplace"] = "";
    }
  }
  if (ref["@birthplace"]) ref["@birthplace"] = standardizePlace(model, ref["@birthplace"]);
  if (ref["@chrplace"]) ref["@chrplace"] = standardizePlace(model, ref["@chrplace"]);
  if (ref["@deathplace"]) ref["@deathplace"] = standardizePlace(model, ref["@deathplace"]);
  if (ref["@burialplace"]) ref["@burialplace"] = standardizePlace(model, ref["@burialplace"]);
  if (ref["@child_of_family"]) {
    let family = model.familyMap[ref["@child_of_family"]];
    if (family) ref["@child_of_family"] = getGedcomFamilyTitle(model, family);
  }
}

function updateFamilyRef(model, ref, findAdd) {
  let family = model.familyMap[ref["@id"]];
  if (family) {
    ref["@title"] = getGedcomFamilyTitle(model, family);
    if (findAdd && family["@match"]) {
      // pass up match title separately
      ref["@match"] = family["@match"];
    }
    if (family["@exclude"] === "true") {
      if (findAdd) ref["@exclude"] = "true";
    }
  }
}

function updateEventFact(model, ef) {
  if (ef["@place"]) ef["@place"] = standardizePlace(model, ef["@place"]);
}

function updateSourceCitation(model, citation, findAdd) {
  let source = model.sourceMap[citation["@source_id"]];
  if (source) {
    citation["@title"] = getGedcomSourceTitle(model, source, findAdd);
    if (source["@exclude"] === "true") {
      if (findAdd) citation["@exclude"] = "true";
    }
  }
}

function deleteExcluded(list) {
  if (!list) {
    return;
  }
  for (let i = list.length() - 1; i >= 0; i--) {
    if (list[i]["@exclude"] === "true") {
      list.splice(i, 1);
    }
  }
}

export function preparePageData(model, data, findAdd = false) {
  // convert titles (excluded, matched); handle living
  // IMPORTANT of order to handle editing the page properly, loading a single page MUST use
  // the GEDCOM title including the GEDCOM key for ref.@title attrs
  let clone = lodash.cloneDeep(data);

  // set the page title
  clone["@title"] = getPrefixedTitle(+data["@ns"], getGedcomPageTitle(model, data));
  clone["@merged"] = data["@merged"];

  // update pf titles (living, excluded), place titles, source titles
  for (let node of clone["child_of_family"] || []) updateFamilyRef(model, node, findAdd);
  for (let node of clone["spouse_of_family"] || []) updateFamilyRef(model, node, findAdd);
  for (let node of clone["husband"] || []) updatePersonRef(model, node, findAdd);
  for (let node of clone["wife"] || []) updatePersonRef(model, node, findAdd);
  for (let node of clone["child"] || []) updatePersonRef(model, node, findAdd);
  for (let node of clone["event_fact"] || []) updateEventFact(model, node);
  for (let node of clone["source_citation"] || []) updateSourceCitation(model, node, findAdd);

  if (findAdd) {
    deleteExcluded(clone["child_of_family"]);
    deleteExcluded(clone["spouse_of_family"]);
    deleteExcluded(clone["husband"]);
    deleteExcluded(clone["wife"]);
    deleteExcluded(clone["child"]);
    deleteExcluded(clone["source_citation"]);
  }
  return clone;
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

export function prepareFindAddData(model, data) {
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

export function getWarningPersonFamily(warn) {
  return +warn["@ns"] === NS_PERSON ? warn["person"][0] : warn["family"][0];
}

export function getWarningLevelDesc(warn) {
  let level = "";
  if (warn["@warningLevel"] === 0) {
    level = "alert";
  } else if (warn["@warningLevel"] === 1) {
    level = "warning";
  } else if (warn["@warningLevel"] === 2) {
    level = "error";
  } else if (warn["@warningLevel"] === 3) {
    level = "duplicate";
  }
  return level;
}

export function getEventFact(obj, typ) {
  if (!obj || !obj["event_fact"]) {
    return null;
  }
  return obj["event_fact"].find(ef => ef["@type"] === typ);
}

function capitalize(s) {
  return s
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.substr(1))
    .join(" ");
}

function dziemba_levenshtein(a, b) {
  let tmp;
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }
  if (a.length > b.length) {
    tmp = a;
    a = b;
    b = tmp;
  }

  let i,
    j,
    res,
    alen = a.length,
    blen = b.length,
    row = Array(alen);
  for (i = 0; i <= alen; i++) {
    row[i] = i;
  }

  for (i = 1; i <= blen; i++) {
    res = i;
    for (j = 1; j <= alen; j++) {
      tmp = row[j - 1];
      row[j - 1] = res;
      res = b[i - 1] === a[j - 1] ? tmp : Math.min(tmp + 1, Math.min(res + 1, row[j] + 1));
    }
  }
  return res;
}

function similarity(a, b) {
  let maxLen = Math.max(a.length, b.length);
  return (maxLen - dziemba_levenshtein(a, b)) / maxLen;
}

//
// support functions
//

export function itemUpdated(model, data) {
  let ns = +data["@ns"];
  if (data["@warningLevel"]) {
    // model.warningsItemUpdated(data)
  } else if (ns === NS_PERSON || ns === NS_FAMILY) {
    if (ns === NS_PERSON) {
      // model.peopleItemUpdated(data);
    } else if (ns === NS_FAMILY) {
      // model.familiesItemUpdated(data);
      if (data["@exclude"] !== "true" && (data["@match"] || data["@matches"])) {
        model.addUpdateMatch(data);
      } else {
        model.removeMatch(data);
      }
    }
    if (data["@warning"] && data["@exclude"] !== "true") {
      model.addUpdateWarnings(data);
    } else {
      model.removeWarnings(data);
    }
  } else if (ns === NS_PLACE) {
    // model.placesItemUpdated(data);
  } else if (ns === NS_MYSOURCE) {
    // model.sourcesItemUpdated(data);
  }
}

export function getTrueFalse(tf) {
  tf = +tf;
  if (tf > 0) {
    return "true";
  }
  if (tf < 0) {
    return "false";
  }
  return "";
}

export function getPositiveNegative(tf) {
  if (tf === "true") {
    return "1";
  } else if (tf === "false") {
    return "-1";
  }
  return "0";
}

//
// update functions
//

// function saveIncludeExclude(exclude, updatedItems) {
//   let saveKeys = [];
//   for (let item of updatedItems) {
//     itemUpdated(item);
//     saveKeys.push(item["@id"]);
//   }
//   if (saveKeys.length > 0) {
//     saveExclude(exclude, saveKeys);
//   }
// }
//
// export function updatePrimary(model, data) {
//   model.primaryPerson = data;
//   data["@exclude"] = "true"; // force inclusion of root"s ancestors by marking root excluded to start
//   let includedItems = [];
//   //ie.includeSelfAndAncestors(data, includedItems);
//   includeItem(model, data, includedItems);
//   updateRootDistances(model);
//   executeServiceCall(wr.updatePrimaryPage(model.gedcomId, data.@id), makeRoot_result, wr.service_fault);
//   saveIncludeExclude("false", includedItems);
// }
//
// export function setExclude(model, data, exclude) {
//   let updatedItems = [];
//   if (exclude === "true") {
//     excludeItem(model, data, updatedItems);
//   }
//   else {
//     includeItem(model, data, updatedItems);
//   }
//   saveIncludeExclude(exclude, updatedItems);
// }
//
// export function setLiving(model, data, living) {
//   data["@living"] = living;
//   itemUpdated(data);
//   saveLiving(data["@living"], data["@id"]);
//   if (+data["@ns"] === NS_PERSON) {
//     for (let ref of data["spouse_of_family"]) {
//       let family = model.familyMap[ref["@id"]];
//       if (family) {
//         let familyIsLiving = "false";
//         for (let spouseRef of family["husband"]) {
//           let spouse = model.personMap[spouseRef["@id"]];
//           if (spouse && spouse["@living"] === "true") familyIsLiving = "true";
//         }
//         for (let spouseRef of family["wife"]) {
//           let spouse = model.personMap[spouseRef["@id"]];
//           if (spouse && spouse["@living"] === "true") familyIsLiving = "true";
//         }
//         if (family["@living"] !== familyIsLiving) {
//           setLiving(family, familyIsLiving);
//         }
//       }
//     }
//   }
// }
//
export function setRead(model, data, read) {
  data["@read"] = read;
  itemUpdated(model, data);
}

export function setWarningRead(model, data, read) {
  data["@warningRead"] = read;
  itemUpdated(model, data);
}

export function setMatchRead(model, data, read) {
  data["@matchRead"] = read;
  itemUpdated(model, data);
}

export function setUpdateRead(model, data, read) {
  data["@updateRead"] = read;
  itemUpdated(model, data);
}

//
// export function setPotentialMatch(data, title, save = true) {
//   let datas = [];
//   datas.push(data);
//   let titles = [];
//   titles.push(title);
//   setPotentialMatches(datas, titles, save);
// }
//
// export function setPotentialMatches(datas, titles, save = true) {
//   let ids = [];
//   for (let i = 0; i < datas.length; i++) {
//     datas[i]["@matches"] = (titles[i].length > 0 ? titles[i] : datas[i]["@gedcomMatches"]);
//     setMatchHelperFields(datas[i]);
//     itemUpdated(datas[i]);
//     if (save) {
//       ids[i] = datas[i]["@id"];
//     }
//   }
//   if (save) {
//     savePotentialMatches(titles, ids);
//   }
// }
