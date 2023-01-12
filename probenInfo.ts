/// <reference path="node_modules/@types/google-apps-script/google-apps-script.properties.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.spreadsheet.d.ts" />
/// <reference path="properties.ts" />
/// <reference path="slack.ts" />
/// <reference path="logging.ts" />
/// <reference path="proben.ts" />
/// <reference path="global functions.ts" />

const planningSheetID = PropertiesService.getScriptProperties().getProperty('planningSheetID') as string;
const planningSheetName = PropertiesService.getScriptProperties().getProperty('planningSheetName') as string;
const webhookProben = PropertiesService.getScriptProperties().getProperty('slackWebHookProben');
const webhookTest = PropertiesService.getScriptProperties().getProperty('slackWebHookTest');
const trainingSheetName = PropertiesService.getScriptProperties().getProperty('trainingSheetName') as string;

function getAndPostTodaysProbenInfo() {
  const today = new Date();
  const data = findProbenInfo(today);
  if (!data) {
    // no info on today, do nothing.
    return;
  }
  var content;
  if (data.status == "fällt aus") {
    content = getSlackMessageForAusfall();
  } else {
    content = getSlackMessageForProbe(data);
  }
  sendAlert(content, webhookProben, true);
}

function findProbenInfo(searchDate: Date) {
  // Get the right TAB
  const spreadsheet = SpreadsheetApp.openById(planningSheetID);
  const sheet = spreadsheet.getSheetByName(trainingSheetName) as GoogleAppsScript.Spreadsheet.Sheet;
  // Get Headers
  const header = getHeaderOfSheet(sheet);
  const firstDataRow = 2; //Table starts at 1, but 1 is headers
  const expectDateWithinRows = 100;  // expect to find today's training within X entries (rows)

  const dateRange = sheet.getRange(firstDataRow, header["Datum"], expectDateWithinRows);
  const dates = dateRange.getValues();

  const matchingDataIndex = findIndexOfDate(dates, searchDate);
  if (matchingDataIndex < 0) {
    Logger.log(FORMAT + "Attempted to find training for %s, but none was present!", WARN, SLACK, searchDate.toDateString());
    return null;
  }
  return getDataFromTrainingRow(sheet, header, matchingDataIndex + firstDataRow);
}

function findIndexOfDate(array2d, dateToFind) {
  for (var i = 72; i <= array2d.length; i++) {
    const rowDate = new Date(array2d[i][0]);
    if (areDatesEqualDayOnly(rowDate, dateToFind)) {
      return i;
    }
  }
  return -1;
}

function getSlackMessageForProbe(trainingData: any) {
  const trainingStart = new Date(trainingData.startDate);
  const date = formatDateForHumans(trainingStart);
  const time = formatTimeForHumans(trainingStart);

  Logger.log(FORMAT + "Producing Slack information for today's training (%s) at %s!", INFO, SLACK, date, time);

  // https://api.slack.com/reference/surfaces/formatting#retrieving-messages
  return {
    "text": "PROBE HEUTE UM " + time + " UHR, " + trainingData.location + "\nLeitung durch: " + trainingData.trainer + ", Thema: '" + trainingData.topic + "'\n <!channel>"
  }
}

function getSlackMessageForAusfall() {
  return {
    "text": "Heute leider keine Probe :cry: \n <!channel> :beer:?"
  }
}

function test_findProbenInfo_and_test_PostProbe() {
  const fakeToday = new Date();
  fakeToday.setDate(16);
  const data = findProbenInfo(fakeToday);
  if (data) {
    sendAlert(getSlackMessageForProbe(data), webhookTest, false);
  }
}

function test_postProbe() {
  var data: any = {};
  data.startDate = new Date();
  data.location = "Merlin"
  data.trainer = "Joka"
  data.topic = "Probenbeteiligung";
  sendAlert(getSlackMessageForProbe(data), webhookTest, false);
}

function test_postAusfall() {
  sendAlert(getSlackMessageForAusfall(), webhookTest, false);
}
