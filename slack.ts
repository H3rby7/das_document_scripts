/// <reference path="node_modules/@types/google-apps-script/google-apps-script.spreadsheet.d.ts" />

function getHeaderOfSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
  const data = sheet.getDataRange().getValues();
  var header = {};
  const headerRow = data[0];
  if (!headerRow) return {};
  for (var i = 0; i < headerRow.length; i++) {
    header[headerRow[i]] = Math.floor(i + 1);
  }
  return header;
}

function padText(text: string, width: number, padRight: boolean) {
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

function padNumber(amount: number, width: number) {
  var padding = "";
  while (padding.length < width - 1 && amount < Math.pow(10, width - padding.length - 1))
    padding += "0";
  return padding + amount.toString();
}

function sortSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, column: number, ascending: boolean) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  const range = sheet.getRange(2, 1, lastRow, lastColumn);
  range.sort({column: column, ascending: ascending});
}

function daysToMillis(dayCount: number) {
  return dayCount * 24 * 60 * 60 * 1000;
}

function isWithinDays(utcMillisToCheck: number, dayCount: number) {
  return utcMillisToCheck < (Date.now() + daysToMillis(dayCount))
}