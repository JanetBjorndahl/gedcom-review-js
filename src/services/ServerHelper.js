import axios from "axios";
import axiosRetry from "axios-retry";

const axiosClient = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  withCredentials: false, // This is the default
  headers: {
    Accept: "text/xml",
    "Content-Type": "text/xml"
  }
});
axiosRetry(axiosClient, { retries: 3 }); // retry non-POST requests on network or 5XX errors

export function sendAjaxService(functionName, parms, method = "GET") {
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
  return axiosClient.request({
    method: method,
    url: getBaseURL(),
    params: sendParms
  });
}

function getBaseURL() {
  return "/w/index.php";
}
