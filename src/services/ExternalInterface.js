// let currURL = "";
// let isChangingURL = false;
// let inCriticalSection = false;

export function loadContent(url) {
  // inCriticalSection = true;
  document.getElementById("iframe").src = url;
  // currURL = url;
  // isChangingURL = currURL !== parent.content.location.href;
  // inCriticalSection = false;
}

export function loadParentContent(url) {
  window.location.href = url;
}

export function loadContentNewWindow(url) {
  window.open(
    url,
    "",
    "height=600,width=700,scrollbars=yes,resizable=yes,toolbar=yes,menubar=no,location=no,directories=no"
  );
}
