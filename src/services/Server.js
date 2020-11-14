import { sendAjaxService } from "./ServerHelper";
import { parseXML, toXMLString } from "@/utils/XMLUtils";

export const WR_SERVER = "www.werelate.org";

export function readGedcom(gedcomId) {
  return sendAjaxService("wfReadGedcom", { gedcom_id: gedcomId }).then(res => parseXML(res.data));
}

export function readGedcomData(gedcomId) {
  return sendAjaxService("wfReadGedcomData", { gedcom_id: gedcomId }).then(res => parseXML(res.data));
}

export function updatePrimaryPage(gedcomId, primaryId) {
  return sendAjaxService("wfUpdateGedcomPrimary", { gedcom_id: gedcomId, primary: primaryId }).then(res =>
    parseXML(res.data)
  );
}

export function sendPageData(data) {
  let xml = toXMLString(data);
  return sendAjaxService("wfSetGedcomPage", xml, "POST").then(res => parseXML(res.data));
}

export function readGedcomPageData(gedcomId, key) {
  return sendAjaxService("wfReadGedcomPageData", { gedcom_id: gedcomId, key: key }).then(res => parseXML(res.data));
}

export function updateGedcomFlag(gedcomId, attr, value, keys) {
  let key;
  let method;
  if (Array.isArray(keys)) {
    key = keys.join("/");
    method = "POST";
  } else {
    key = keys.toString();
    method = "GET";
  }
  return sendAjaxService(
    "wfUpdateGedcomFlag",
    { gedcom_id: gedcomId, attr: attr, value: value, key: key },
    method
  ).then(res => parseXML(res.data));
}

export function saveMatchedFamily(data) {
  return sendAjaxService("wfMatchFamily", toXMLString(data), "POST").then(res => parseXML(res.data));
}

export function saveMatchesToServer(gedcomId, prefixedTitles, merged, keys) {
  return sendAjaxService(
    "wfUpdateGedcomMatches",
    { gedcom_id: gedcomId, match: prefixedTitles.join("/"), key: keys.join("/"), merged: merged.join("/") },
    "POST"
  ).then(res => parseXML(res.data));
}

// potential matches are unprefixed titles
export function savePotentialMatches(gedcomId, potentialMatches, keys) {
  return sendAjaxService(
    "wfUpdateGedcomPotentialMatches",
    { gedcom_id: gedcomId, matches: potentialMatches.join("/"), key: keys.join("/") },
    "POST"
  ).then(res => parseXML(res.data));
}

export function updateGedcomStatus(gedcomId, status, warning) {
  return sendAjaxService("wfUpdateGedcomStatus", {
    gedcom_id: gedcomId,
    gedcomStatus: status,
    warning: warning
  }).then(res => parseXML(res.data));
}
