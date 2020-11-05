// escapes a string so we can embed it in XML
export function escapeXML(s) {
  if (typeof s === "number") {
    s = s.toString();
  }
  if (!s) {
    return "";
  }
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\\'/g, "&apos;")
    .replace(/\\"/g, "&quot;");
}

// escapes a string so we can embed it in HTML
export function htmlspecialchars(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\\"/g, "&quot;");
}

const slashRegExp = /%2F/g;
const colonRegExp = /%3A/g;
const spaceRegExp = /%20/g;
const hashRegExp = /%23/g;

export function encodeWikiURIComponent(url) {
  // MediaWiki wants /'s in titles to not be encoded
  // and we might as well unencode :'s so the titles look better
  // also, we need to unencode #'s and spaces
  return encodeURIComponent(url)
    .replace(colonRegExp, ":")
    .replace(slashRegExp, "/")
    .replace(spaceRegExp, "_")
    .replace(hashRegExp, "#");
}

export function objectToQuery(obj) {
  return Object.keys(obj)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
    .join("&");
}
