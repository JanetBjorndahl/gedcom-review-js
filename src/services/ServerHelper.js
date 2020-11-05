import axios from "axios";
import axiosRetry from "axios-retry";
import { parseXML } from "@/utils/XMLUtils.js";

const axiosClient = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  withCredentials: false, // This is the default
  headers: {
    Accept: "text/xml",
    "Content-Type": "text/xml"
  }
});
axiosRetry(axiosClient, { retries: 3 }); // retry non-POST requests on network or 5XX errors

export function post(url, data, config) {
  return request({
    method: "POST",
    url: url,
    data: data,
    ...config
  });
}

export function put(url, data, config) {
  return request({
    method: "PUT",
    url: url,
    data: data,
    ...config
  });
}

export function get(url, config) {
  return request({
    method: "GET",
    url: url,
    ...config
  }).then(res => {
    return parseXML(res.data);
  });
}

export function del(url, config) {
  return request({
    method: "DELETE",
    url: url,
    ...config
  });
}

export function request(config) {
  return axiosClient.request(config);
}
