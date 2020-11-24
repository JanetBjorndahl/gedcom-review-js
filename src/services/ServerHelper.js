import axios from "axios";
import axiosRetry from "axios-retry";

const axiosClient = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  withCredentials: false, // This is the default
  headers: {
    Accept: "text/xml",
    "Content-Type": "multipart/form-data"
  }
});
axiosRetry(axiosClient, { retries: 3 }); // retry non-POST requests on network or 5XX errors

export function sendAjaxService(functionName, params, method = "GET") {
  let sendParams = { action: "ajax", rs: functionName };
  let rsargs = "";
  let data = null;
  if (typeof params === "string") {
    rsargs = params;
  } else if (params) {
    for (let key of Object.keys(params)) {
      if (rsargs.length > 0) rsargs += "|";
      rsargs += key + "=" + params[key];
    }
  }
  if (rsargs.length > 0) {
    sendParams["rsargs"] = rsargs;
  }
  if (method === "POST") {
    data = new FormData();
    for (let key of Object.keys(sendParams)) {
      data.append(key, sendParams[key]);
    }
    sendParams = null;
  }
  return axiosClient.request({
    method: method,
    url: getBaseURL(),
    params: sendParams,
    data: data
  });
}

function getBaseURL() {
  return "/w/index.php";
}
