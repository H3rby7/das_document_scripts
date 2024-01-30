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

interface CanPatchEvent {
  startDate: Date;
  endDate: Date;
  eventName: string;
  description: string;
  location: string;
}

function patchEvent(event: GoogleAppsScript.Calendar.CalendarEvent, patch: CanPatchEvent, logger: string ) {
  const eventId = event.getId();
  if (event.getTitle() !== patch.eventName) {
    Logger.log(FORMAT + "Event: %s, updating title from '%s' to '%s'", INFO, logger, eventId, event.getTitle(), patch.eventName);
    event.setTitle(patch.eventName);
  }
  if (!areDatesEqual(event.getStartTime(), patch.startDate) || !areDatesEqual(event.getEndTime(), patch.endDate)) {
    Logger.log(FORMAT + "Event: %s, updating time from START: '%s', END: '%s' to START: '%s' END: '%s'", INFO, logger, eventId, event.getStartTime().toISOString(), event.getEndTime().toISOString(), patch.startDate.toISOString(), patch.endDate.toISOString());
    event.setTime(patch.startDate, patch.endDate);
  }
  if (event.getDescription() !== patch.description) {
    Logger.log(FORMAT + "Event: %s, updating description from '%s' to '%s'", INFO, logger, eventId, event.getDescription(), patch.description);
    event.setDescription(patch.description);
  }
  if (event.getLocation() !== patch.location) {
    Logger.log(FORMAT + "Event: %s, updating location from '%s' to '%s'", INFO, logger, eventId, event.getLocation(), patch.location);
    event.setLocation(patch.location);
  }
}