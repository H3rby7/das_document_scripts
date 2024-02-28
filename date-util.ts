/// <reference path="node_modules/@types/google-apps-script/google-apps-script.spreadsheet.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />

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

function dateAddMillis(date: Date, add: number): Date {
  return new Date(date.getTime() + add);
}

function dateAddSeconds(date: Date, add: number): Date {
  return dateAddMillis(date, 1000 * add);
}

function dateAddMinutes(date: Date, add: number): Date {
  return dateAddSeconds(date, 60 * add);
}

function dateAddHours(date: Date, add: number): Date {
  return dateAddMinutes(date, 60 * add);
}

function dateAddDays(date: Date, add: number): Date {
  return dateAddHours(date, 24 * add);
}
