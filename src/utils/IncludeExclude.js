import {
  NS_PERSON,
  NS_FAMILY,
  NOT_CONNECTED,
  MAX_PEOPLE,
  getPersonFamilyData,
  getReferences
} from "@/utils/ModelUtils.js";

function getRefDistance(model, id, ns) {
  let data = getPersonFamilyData(model, id, ns);
  return data ? data["@distance"] : NOT_CONNECTED;
}

// get distance for id by looking at immediate relatives
function getMinDistance(model, data) {
  if (data["@distance"] === 0) return 0; // root
  let dist = NOT_CONNECTED;
  if (+data["@ns"] === NS_PERSON) {
    for (let relRef of data["child_of_family"] || []) {
      dist = Math.min(dist, getRefDistance(model, relRef["@id"], NS_FAMILY));
    }
    for (let relRef of data["spouse_of_family"] || []) {
      dist = Math.min(dist, getRefDistance(model, relRef["@id"], NS_FAMILY));
    }
  } else {
    for (let relRef of data["husband"] || []) {
      dist = Math.min(dist, getRefDistance(model, relRef["@id"], NS_PERSON));
    }
    for (let relRef of data["wife"] || []) {
      dist = Math.min(dist, getRefDistance(model, relRef["@id"], NS_PERSON));
    }
    for (let relRef of data["child"] || []) {
      dist = Math.min(dist, getRefDistance(model, relRef["@id"], NS_PERSON));
    }
  }
  if (dist !== NOT_CONNECTED) dist = dist + 1;
  return dist;
}

function updateRelatedDistanceIncludeRelative(model, id, ns, includedItems, dist) {
  let relative = getPersonFamilyData(model, id, ns);
  if (relative) {
    if (relative["@distance"] > dist + 1) {
      // && relative.@exclude != "true") {
      relative["@distance"] = dist + 1;
      updateRelatedDistanceInclude(model, relative, includedItems);
    }
  }
}

function updateRelatedDistanceInclude(model, data, includedItems) {
  let dist = data["@distance"];
  if (+data["@ns"] === NS_PERSON) {
    for (let ref of data["child_of_family"] || [])
      updateRelatedDistanceIncludeRelative(model, ref["@id"], NS_FAMILY, includedItems, dist);
    for (let ref of data["spouse_of_family"] || [])
      updateRelatedDistanceIncludeRelative(model, ref["@id"], NS_FAMILY, includedItems, dist);
  } else {
    for (let ref of data["husband"] || [])
      updateRelatedDistanceIncludeRelative(model, ref["@id"], NS_PERSON, includedItems, dist);
    for (let ref of data["wife"] || [])
      updateRelatedDistanceIncludeRelative(model, ref["@id"], NS_PERSON, includedItems, dist);
    for (let ref of data["child"] || [])
      updateRelatedDistanceIncludeRelative(model, ref["@id"], NS_PERSON, includedItems, dist);
  }
}

function isExcluded(model, id, ns) {
  let data = getPersonFamilyData(model, id, ns);
  return data["@exclude"] === "true";
}

function countIncludedFamilyMembers(model, data) {
  let includedMembers = 0;
  for (let ref of data["husband"] || []) if (!isExcluded(model, ref["@id"], NS_PERSON)) includedMembers++;
  for (let ref of data["wife"] || []) if (!isExcluded(model, ref["@id"], NS_PERSON)) includedMembers++;
  for (let ref of data["child"] || []) if (!isExcluded(model, ref["@id"], NS_PERSON)) includedMembers++;
  return includedMembers;
}

function testIncludeFamily(model, id, includedItems) {
  let data = getPersonFamilyData(model, id, NS_FAMILY);
  if (data && data["@exclude"] === "true") {
    if (countIncludedFamilyMembers(model, data) > 1) {
      includeItem(model, data, includedItems);
    }
  }
}

function includeRelatedFamilies(model, data, includedItems) {
  for (let ref of data["child_of_family"] || []) testIncludeFamily(model, ref["@id"], includedItems);
  for (let ref of data["spouse_of_family"] || []) testIncludeFamily(model, ref["@id"], includedItems);
}

export function includeItem(model, data, includedItems) {
  data["@exclude"] = "false";
  includedItems.push(data);
  if (+data["@ns"] === NS_PERSON || +data["@ns"] === NS_FAMILY) {
    // include excluded sources referenced by this page
    for (let sc of data["source_citation"] || []) {
      let sourceId = sc["@source_id"];
      if (sourceId) {
        let page = model.sourceMap[sourceId];
        if (page && page["@exclude"] === "true") {
          includeItem(model, page, includedItems);
        }
      }
    }
  }
  if ((+data["@ns"] === NS_PERSON || +data["@ns"] === NS_FAMILY) && model.people.length <= MAX_PEOPLE) {
    data["@distance"] = getMinDistance(model, data);
    if (data["@distance"] !== NOT_CONNECTED) {
      updateRelatedDistanceInclude(model, data, includedItems);
    }
  }
  if (+data["@ns"] === NS_PERSON) {
    includeRelatedFamilies(model, data, includedItems);
  }
}

function updateRelatedDistanceExcludeRelative(model, id, ns) {
  let relative = getPersonFamilyData(model, id, ns);
  if (relative && relative["@exclude"] !== "true") {
    if (relative["@distance"] < getMinDistance(model, relative)) {
      //relative.@distance = ModelUtils.NOT_CONNECTED; // assume not connected anymore
      updateRelatedDistanceExclude(model, relative);
    }
  }
}

function updateRelatedDistanceExclude(model, data) {
  if (data["@ns"] === NS_PERSON) {
    for (let ref of data["child_of_family"] || []) updateRelatedDistanceExcludeRelative(model, ref["@id"], NS_FAMILY);
    for (let ref of data["spouse_of_family"] || []) updateRelatedDistanceExcludeRelative(model, ref["@id"], NS_FAMILY);
  } else {
    for (let ref of data["husband"] || []) updateRelatedDistanceExcludeRelative(model, ref["@id"], NS_PERSON);
    for (let ref of data["wife"] || []) updateRelatedDistanceExcludeRelative(model, ref["@id"], NS_PERSON);
    for (let ref of data["child"] || []) updateRelatedDistanceExcludeRelative(model, ref["@id"], NS_PERSON);
  }
}

function testExcludeFamily(model, id, excludedItems) {
  let data = getPersonFamilyData(model, id, NS_FAMILY);
  if (data && data["@exclude"] !== "true") {
    if (countIncludedFamilyMembers(model, data) <= 1) {
      excludeItem(model, data, excludedItems);
    }
  }
}

function excludeRelatedFamilies(model, data, excludedItems) {
  for (let ref of data["child_of_family"] || []) testExcludeFamily(model, ref["@id"], excludedItems);
  for (let ref of data["spouse_of_family"] || []) testExcludeFamily(model, ref["@id"], excludedItems);
}

export function excludeItem(model, data, excludedItems) {
  data["@exclude"] = "true";
  excludedItems.push(data);
  if (+data["@ns"] === NS_PERSON || +data["@ns"] === NS_FAMILY) {
    // excluded sources referenced only by this page
    for (let sc of data["source_citation"] || []) {
      let sourceId = sc["@source_id"];
      if (sourceId) {
        let page = model.sourceMap[sourceId];
        if (page) {
          let found = false;
          for (let pf of getReferences(model, page)) {
            if (pf["@exclude"] !== "true") {
              found = true;
              break;
            }
          }
          if (!found) {
            excludeItem(model, page, excludedItems);
          }
        }
      }
    }
  }
  if (data["@ns"] === NS_PERSON) {
    excludeRelatedFamilies(model, data, excludedItems);
  }
}

export function updateRootDistances(model) {
  for (let person of model.people) {
    person["@distance"] = NOT_CONNECTED;
  }
  for (let family of model.families) {
    family["@distance"] = NOT_CONNECTED;
  }
  if (model.primaryPerson !== null && model.people.length <= MAX_PEOPLE) {
    model.primaryPerson["@distance"] = 0;
    updateRelatedDistanceInclude(model, model.primaryPerson, null);
  }
}
