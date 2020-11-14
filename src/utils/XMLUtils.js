import { escapeXML } from "@/utils/StringUtils";

export function parseXML(data) {
  const parser = new DOMParser();
  return parser.parseFromString(data, "application/xml").documentElement;
}

export function xmlToJson(xml) {
  if (!xml) {
    return null;
  }
  let obj = {};
  if (xml.nodeType === 1) {
    // element
    obj["#tag"] = xml.nodeName;
    // do attributes
    for (let j = 0; j < xml.attributes.length; j++) {
      let attribute = xml.attributes.item(j);
      obj["@" + attribute.nodeName] = attribute.nodeValue;
    }
  } else if (xml.nodeType === 3) {
    // text
    obj = xml.nodeValue.trim();
  }

  // do children
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      let item = xml.childNodes.item(i);
      let value = xmlToJson(item);
      if (!value) {
        continue;
      }
      if (item.nodeType === 3) {
        obj["#text"] = value;
        continue;
      }
      let nodeName = item.nodeName;
      if (!obj[nodeName]) {
        obj[nodeName] = [];
      }
      obj[nodeName].push(value);
    }
  }
  return obj;
}

export function toXMLString(data) {
  let tag = data["#tag"] || "gedcom";
  let text = data["#text"] || "";
  let content = data["#content"] || "";
  let attrs = [];
  let children = [];
  for (let k of Object.keys(data)) {
    if (k.startsWith("#")) {
      // ignore
    } else if (k.startsWith("@")) {
      if (data[k] != null) {
        attrs.push(` ${k.substr(1)}="${escapeXML(data[k])}"`);
      }
    } else {
      for (let e of data[k]) {
        children.push(toXMLString(e));
      }
    }
  }
  if (content) {
    children.push("<content>" + escapeXML(content) + "</content>");
  }
  return `<${tag}${attrs.join("")}>${children.join("")}${escapeXML(text)}</${tag}>`;
}

export function getChildElementsWithTag(elm, tag) {
  let children = [];
  for (let i = 0; i < elm.children.length; i++) {
    if (elm.children[i].tagName === tag) {
      children.push(elm.children[i]);
    }
  }
  return children;
}

export function getElementText(xml) {
  for (let i = 0; i < xml.childNodes.length; i++) {
    let item = xml.childNodes.item(i);
    let value = xmlToJson(item);
    if (!value) {
      continue;
    }
    if (item.nodeType === 3) {
      return value;
    }
  }
  return "";
}
