/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.spreadsheet.d.ts" />
/// <reference path="properties.ts" />
/// <reference path="slack.ts" />
/// <reference path="logging.ts" />
/// <reference path="proben.ts" />
/// <reference path="global-functions.ts" />

function getAndPostTomorrowsProbenInfo(dev = false) {
  const tomorrow = dateAddDays(new Date(), 1);
  const data = findProbenInfo(tomorrow, dev);
  if (!data) {
    // no info on tomorrow, do nothing.
    return;
  }
  let content: SlackSimpleText;
  if (data.status == "fällt aus") {
    content = getSlackMessageForAusfall();
  } else {
    content = getSlackMessageForProbe(data);
  }
  sendSlackAlert(content, getSlackHookProben(dev), true);
}

function findProbenInfo(searchDate: Date, dev = false): Rehearsal | null {
  // Get the right TAB
  const spreadsheet = SpreadsheetApp.openById(getPlanningSheetID(dev));
  const sheet = spreadsheet.getSheetByName(getTrainingSheetName()) as GoogleAppsScript.Spreadsheet.Sheet;
  // Get Headers
  const header = getHeaderOfSheet(sheet);
  const firstDataRow = 2; //Table starts at 1, but 1 is headers
  const expectDateWithinRows = 100;  // expect to find the training within X entries (rows)

  const dateRange = sheet.getRange(firstDataRow, header["Datum"], expectDateWithinRows);
  const dates = dateRange.getValues() as DateArray[];

  const matchingDataIndex = findIndexOfDate(dates, searchDate);
  if (matchingDataIndex < 0) {
    Logger.log(FORMAT + "Attempted to find training for %s, but none was present!", WARN, PROBEN_INFO, searchDate.toDateString());
    return null;
  }
  return getDataFromTrainingRow(sheet, header, matchingDataIndex + firstDataRow);
}

type DateArray = {
  [key: number]: Date;
}

function findIndexOfDate(array2d: DateArray[], dateToFind: Date): number {
  for (let i = 0; i < array2d.length; i++) {
    const rowDate = new Date(array2d[i][0]);
    if (areDatesEqualDayOnly(rowDate, dateToFind)) {
      return i;
    }
  }
  return -1;
}

function getSlackMessageForProbe(trainingData: Rehearsal): SlackSimpleText {
  const trainingStart = new Date(trainingData.startDate);
  const date = formatDateForHumans(trainingStart);
  const time = formatTimeForHumans(trainingStart);

  Logger.log(FORMAT + "Producing Slack information for tomorrow's (%s) training at %s!", INFO, PROBEN_INFO, date, time);

  // https://api.slack.com/reference/surfaces/formatting#retrieving-messages
  return {
    "text": "PROBE MORGEN UM " + time + " UHR, " + trainingData.location + "\nLeitung durch: " + trainingData.trainer + ", Thema: '" + trainingData.topic + "'\n<!channel>"
  }
}

function getSlackMessageForAusfall(): SlackSimpleText {
  Logger.log(FORMAT + "Producing Slack canceled training message.", INFO, PROBEN_INFO);
  return {
    "text": "Morgen leider keine Probe :cry: \n<!channel> :beer:?"
  }
}

function test_findProbenInfo_and_test_PostProbe() {
  const fakeDate = new Date();
  fakeDate.setDate(16); // <- Change this to the day of the month, which has a rehearsal
  const data = findProbenInfo(fakeDate, true);
  if (data) {
    sendSlackAlert(getSlackMessageForProbe(data), getSlackHookProben(true), false);
  }
}

function test_postProbe() {
  const data: Rehearsal = {
    startDate: new Date(),
    location: "Merlin",
    trainer: "Joka",
    topic: "Probenbeteiligung",
    description: "",
    endDate: new Date(),
    eventName: "evtName",
    notes: "no notes",
    status: "Findet statt",
    type: "Orga"
  };
  sendSlackAlert(getSlackMessageForProbe(data), getSlackHookProben(true), false);
}

function test_postAusfall() {
  sendSlackAlert(getSlackMessageForAusfall(), getSlackHookProben(true), false);
}
