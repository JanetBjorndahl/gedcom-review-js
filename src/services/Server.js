import { request } from "./ServerHelper";
import { parseXML, toXMLString } from "@/utils/XMLUtils";

export const WR_SERVER = "www.werelate.org";

function getBaseURL() {
  // return "https://" + WR_SERVER + "/w/index.php";
  return "/w/index.php";
}

function sendAjaxService(functionName, parms, method = "GET") {
  let sendParms = { action: "ajax", rs: functionName };
  let rsargs = "";
  if (typeof parms === "string") {
    rsargs = parms;
  } else if (parms) {
    for (let key of Object.keys(parms)) {
      if (rsargs.length > 0) rsargs += "|";
      rsargs += key + "=" + parms[key];
    }
  }
  if (rsargs.length > 0) {
    sendParms["rsargs"] = rsargs;
  }
  return request({
    method: method,
    url: getBaseURL(),
    params: sendParms
  });
}

// function handleFatalError(event) {
//   ExternalInterface.call("loadParentContent", "https://"+WR_SERVER);
// }

// export function service_fault(event) {
//   Alert.show(event.fault.message, "Unable to complete request",
//     Alert.OK, null, handleFatalError, WarningIcon);
// }

// export function statusError(result) {
//   var msg;
//   var parms = null;
//   var status = result ? int(result.@status) : 404;
//   if (status == STATUS_NOT_SIGNED_IN) {
//     msg="notsignedin";
//   }
//   else if (status == STATUS_NOT_AUTHORIZED) {
//     msg = "notauthorized";
//   }
//   else if (status == STATUS_NOT_FOUND) {
//     msg = "gedcomnotfound";
//   }
//   else if (status == STATUS_ON_HOLD) {
//     msg = "gedcomhold";
//   }
//   else {
//     msg = "unexpectederror";
//     parms = [status];
//   }
//   Alert.show(ResourceManager.getInstance().getString("messages", msg, parms),
//     "Unable to complete request", Alert.OK, null, handleFatalError, WarningIcon);
// }

export function readGedcom(gedcomId) {
  return sendAjaxService("wfReadGedcom", { gedcom_id: gedcomId }).then(res => parseXML(res.data));
}

export function readGedcomData(gedcomId) {
  return sendAjaxService("wfReadGedcomData", { gedcom_id: gedcomId }).then(res => parseXML(res.data));
}

export function updatePrimaryPage(gedcomId, primaryId) {
  return sendAjaxService("wfUpdateGedcomPrimary", { gedcom_id: gedcomId, primary: primaryId });
}

export function sendPageData(data) {
  let xml = toXMLString(data);
  return sendAjaxService("wfSetGedcomPage", xml, "POST");
}

export function readGedcomPageData(gedcomId, key) {
  return sendAjaxService("wfReadGedcomPageData", { gedcom_id: gedcomId, key: key });
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
  return sendAjaxService("wfUpdateGedcomFlag", { gedcom_id: gedcomId, attr: attr, value: value, key: key }, method);
}

export function saveMatchedFamily(data) {
  return sendAjaxService("wfMatchFamily", toXMLString(data), "POST");
}

export function saveMatchesToServer(gedcomId, prefixedTitles, merged, keys) {
  return sendAjaxService(
    "wfUpdateGedcomMatches",
    { gedcom_id: gedcomId, match: prefixedTitles.join("/"), key: keys.join("/"), merged: merged.join("/") },
    "POST"
  );
}

// potential matches are unprefixed titles
export function savePotentialMatches(gedcomId, potentialMatches, keys) {
  return sendAjaxService(
    "wfUpdateGedcomPotentialMatches",
    { gedcom_id: gedcomId, matches: potentialMatches.join("/"), key: keys.join("/") },
    "POST"
  );
}

export function updateGedcomStatus(gedcomId, status, warning) {
  return sendAjaxService("wfUpdateGedcomStatus", { gedcom_id: gedcomId, gedcomStatus: status, warning: warning });
}
