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

export function similarity(a, b) {
  let maxLen = Math.max(a.length, b.length);
  return (maxLen - dziemba_levenshtein(a, b)) / maxLen;
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
