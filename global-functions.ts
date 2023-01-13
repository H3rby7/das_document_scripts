/// <reference path="node_modules/@types/google-apps-script/google-apps-script.spreadsheet.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />

type Header = {
  [key: string]: number;
}

function getHeaderOfSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): Header {
  const data = sheet.getDataRange().getValues();
  const header: Header = {};
  const headerRow = data[0];
  if (!headerRow) return {};
  for (let i = 0; i < headerRow.length; i++) {
    header[headerRow[i]] = Math.floor(i + 1);
  }
  return header;
}

function sortSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, column: number, ascending: boolean) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  const range = sheet.getRange(2, 1, lastRow, lastColumn);
  range.sort({column: column, ascending: ascending});
}

function padText(text: string, width: number, padRight: boolean): string {
  if(text.length > width) {
    return text.slice(text.length - width);
  }
  while(text.length < width) {
    if (padRight) {
      text = text + " ";
    } else {
      text = " " + text;
    }
  }
  return text;
}

function padNumber(amount: number, width: number): string {
  let padding = "";
  while (padding.length < width - 1 && amount < Math.pow(10, width - padding.length - 1))
    padding += "0";
  return padding + amount.toString();
}

function test_areDatesEqual() {
  const a = new Date();
  const b = new Date(a);
  b.setMinutes(0);
  const eq = areDatesEqual(a, b);
  Logger.log(eq);
}

function areDatesEqual(a: GoogleAppsScript.Base.Date, b: GoogleAppsScript.Base.Date): boolean {
  if (!areDatesEqualDayOnly(a, b)) {
    return false;
  }
  if (a.getHours() != b.getHours()) {
    return false;
  }
  if (a.getMinutes() != b.getMinutes()) {
    return false;
  }
  if (a.getSeconds() != b.getSeconds()) {
    return false;
  }
  if (a.getMilliseconds() != b.getMilliseconds()) {
    return false;
  }
  return true;
}

function areDatesEqualDayOnly(a: GoogleAppsScript.Base.Date, b: GoogleAppsScript.Base.Date): boolean {
  if (a.getTimezoneOffset() != b.getTimezoneOffset()) {
    return false;
  }
  if (a.getFullYear() != b.getFullYear()) {
    return false;
  }
  if (a.getMonth() != b.getMonth()) {
    return false;
  }
  if (a.getDate() != b.getDate()) {
    return false;
  }
  return true;
}

function formatDateForEvent(date: GoogleAppsScript.Base.Date): string {
 date = date ? date : new Date();
 const offset = date.getTimezoneOffset();
 return padNumber(date.getFullYear(), 4)
   + "-" + padNumber(date.getMonth() + 1, 2)
   + "-" + padNumber(date.getDate(), 2)
   + "T" + padNumber(date.getHours(), 2)
   + ":" + padNumber(date.getMinutes(), 2)
   + ":" + padNumber(date.getSeconds(), 2)
   + (offset > 0 ? "-" : "+")
   + padNumber(Math.floor(Math.abs(offset) / 60), 2)
   + ":" + padNumber(Math.abs(offset) % 60, 2);
}

function formatDateForHumans(date: GoogleAppsScript.Base.Date): string {
  return padNumber(date.getDate(), 2)
  + "." + padNumber(date.getMonth() + 1, 2)
  + "." + padNumber(date.getFullYear(), 4);
}

function formatTimeForHumans(date: GoogleAppsScript.Base.Date): string {
 return padNumber(date.getHours(), 2)
   + ":" + padNumber(date.getMinutes(), 2);
}

function daysToMillis(dayCount: number): number {
  return dayCount * 24 * 60 * 60 * 1000;
}

function isWithinDays(utcMillisToCheck: number, dayCount: number): boolean {
  return utcMillisToCheck < (Date.now() + daysToMillis(dayCount))
}
