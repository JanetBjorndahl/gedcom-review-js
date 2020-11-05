const MONTHS = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
  febr: 2,
  sept: 9
};

function getAlphaMonth(mon) {
  mon = mon.toLowerCase();
  return MONTHS[mon] || 0;
}

function isYear(y) {
  return y >= 1000 && y < 2200;
}

function isDay(d) {
  return d >= 1 && d <= 31;
}

function isNumMonth(m) {
  return m >= 1 && m <= 12;
}

const pAlphaNumRegExp = new RegExp("\\d+|[^0-9\\s~!@#$%^&*()_+\\-={}|:'<>?;,./\"\\[\\]\\\\]+", "g");

export function getDateSortKey(date) {
  let result = "";
  if (!date) {
    return result;
  }
  let year = 0;
  let month = 0;
  let day = 0;
  let fields = [...date.matchAll(pAlphaNumRegExp)];

  for (let i = 0; i < fields.length; i++) {
    let field = fields[i][0];
    let num = +field;
    if (isYear(num)) {
      if (year === 0) {
        year = num;
      }
    } else if (getAlphaMonth(field) > 0) {
      if (month === 0) {
        month = getAlphaMonth(field);
      }
    } else if (
      isDay(num) &&
      (!isNumMonth(num) ||
        (i > 0 && getAlphaMonth(fields[i - 1][0]) > 0) ||
        (i < fields.length - 1 && getAlphaMonth(fields[i + 1][0]) > 0))
    ) {
      if (day === 0) {
        day = num;
      }
    } else if (i > 0 && isYear(+fields[i - 1])) {
      // ignore -- probably 1963/4
    } else if (isNumMonth(num)) {
      if (month === 0) {
        month = num;
      }
    }
  }

  if (year > 0) {
    result = year.toString();
    if (month > 0) {
      result += month < 10 ? "0" + month.toString() : month.toString();
      if (day > 0) {
        result += day < 10 ? "0" + day.toString() : day.toString();
      }
    }
  }

  return result;
}
